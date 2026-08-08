import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const inserted = await sql`
    INSERT INTO stripe_webhook_events (event_id, type)
    VALUES (${event.id}, ${event.type})
      ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id;
  `;

  if (inserted.length === 0) {
    return Response.json({ received: true, skipped: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await upsertSubscription(sql, event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await sql`
          UPDATE subscriptions
          SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ${subscription.id};
        `;
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionRef =
          invoice.parent?.subscription_details?.subscription;
        const subscriptionId =
          typeof subscriptionRef === "string"
            ? subscriptionRef
            : subscriptionRef?.id;

        if (subscriptionId) {
          await sql`
            UPDATE subscriptions
            SET status = 'past_due', updated_at = CURRENT_TIMESTAMP
            WHERE stripe_subscription_id = ${subscriptionId};
          `;
        }
        break;
      }
      default:
        break;
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function upsertSubscription(
  sql: NeonQueryFunction<false, false>,
  subscription: Stripe.Subscription,
) {
  const owner = await sql`
    SELECT user_id FROM stripe_customers
    WHERE stripe_customer_id = ${subscription.customer as string};
  `;

  if (owner.length === 0) {
    console.warn(
      `No matching user for Stripe customer ${subscription.customer}`,
    );
    return;
  }

  const userId = owner[0].user_id;
  const item = subscription.items.data[0];
  const priceId = item?.price.id ?? "";
  const periodStart = item?.current_period_start;
  const periodEnd = item?.current_period_end;

  await sql`
    INSERT INTO subscriptions (
      stripe_subscription_id, user_id, stripe_customer_id, stripe_price_id,
      status, trial_start, trial_end, current_period_start, current_period_end,
      cancel_at_period_end, default_payment_method_id
    )
    VALUES (
             ${subscription.id}, ${userId}, ${subscription.customer as string}, ${priceId},
             ${subscription.status},
             ${subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null},
             ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null},
             ${periodStart ? new Date(periodStart * 1000).toISOString() : null},
             ${periodEnd ? new Date(periodEnd * 1000).toISOString() : null},
             ${subscription.cancel_at_period_end},
             ${typeof subscription.default_payment_method === "string" ? subscription.default_payment_method : null}
           )
      ON CONFLICT (user_id) DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                                 stripe_customer_id = EXCLUDED.stripe_customer_id,
                                 stripe_price_id = EXCLUDED.stripe_price_id,
                                 status = EXCLUDED.status,
                                 trial_start = EXCLUDED.trial_start,
                                 trial_end = EXCLUDED.trial_end,
                                 current_period_start = EXCLUDED.current_period_start,
                                 current_period_end = EXCLUDED.current_period_end,
                                 cancel_at_period_end = EXCLUDED.cancel_at_period_end,
                                 default_payment_method_id = EXCLUDED.default_payment_method_id,
                                 updated_at = CURRENT_TIMESTAMP;
  `;
}
