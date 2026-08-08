import { neon } from "@neondatabase/serverless";
import { stripe } from "@/lib/stripe";
import { TRIAL_DAYS } from "@/constants";

export async function POST(request: Request) {
  try {
    const { userId, customerId, paymentMethodId } = await request.json();

    if (!userId || !customerId || !paymentMethodId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return Response.json(
        { error: "STRIPE_PRICE_ID not configured" },
        { status: 500 },
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Make the newly-collected card the default so it's charged
    // automatically when the trial ends.
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      default_payment_method: paymentMethodId,
      trial_period_days: TRIAL_DAYS,
      trial_settings: {
        end_behavior: { missing_payment_method: "cancel" },
      },
      expand: ["latest_invoice"],
    });

    // Billing-period dates live on the subscription item, not the
    // subscription itself, as of this API version.
    const item = subscription.items.data[0];
    const periodStart = item?.current_period_start;
    const periodEnd = item?.current_period_end;

    await sql`
      INSERT INTO subscriptions (
        stripe_subscription_id, user_id, stripe_customer_id, stripe_price_id,
        status, trial_start, trial_end, current_period_start, current_period_end,
        cancel_at_period_end, default_payment_method_id
      )
      VALUES (
               ${subscription.id}, ${userId}, ${customerId}, ${process.env.STRIPE_PRICE_ID},
               ${subscription.status},
               ${subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null},
               ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null},
               ${periodStart ? new Date(periodStart * 1000).toISOString() : null},
               ${periodEnd ? new Date(periodEnd * 1000).toISOString() : null},
               ${subscription.cancel_at_period_end}, ${paymentMethodId}
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

    return Response.json(
      {
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
