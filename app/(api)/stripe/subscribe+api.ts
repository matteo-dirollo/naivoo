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

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // ── Trial eligibility ────────────────────────────────────────────
    // A) has this user (by our own record, independent of Stripe state)
    //    already had a trial before?
    const customerRows = await sql`
      SELECT trial_used FROM stripe_customers WHERE user_id = ${userId};
    `;
    const userAlreadyTrialed = customerRows[0]?.trial_used ?? false;

    // B) has this exact card been used for a trial before, by ANY user?
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const fingerprint = paymentMethod.card?.fingerprint ?? null;

    let cardAlreadyTrialed = false;
    let cardUsedByDifferentUser = false;

    if (fingerprint) {
      const fpRows = await sql`
        SELECT user_id FROM stripe_trial_card_fingerprints
        WHERE card_fingerprint = ${fingerprint};
      `;
      if (fpRows.length > 0) {
        cardAlreadyTrialed = true;
        cardUsedByDifferentUser = fpRows[0].user_id !== userId;
      }
    }

    const trialEligible = !userAlreadyTrialed && !cardAlreadyTrialed;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      default_payment_method: paymentMethodId,
      ...(trialEligible
        ? {
            trial_period_days: TRIAL_DAYS,
            trial_settings: {
              end_behavior: { missing_payment_method: "cancel" as const },
            },
          }
        : {}),
      expand: ["latest_invoice"],
    });

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

    if (trialEligible) {
      await sql`
        UPDATE stripe_customers SET trial_used = true WHERE user_id = ${userId};
      `;
      if (fingerprint) {
        await sql`
          INSERT INTO stripe_trial_card_fingerprints (card_fingerprint, user_id, stripe_customer_id)
          VALUES (${fingerprint}, ${userId}, ${customerId})
            ON CONFLICT (card_fingerprint) DO NOTHING;
        `;
      }
    }

    return Response.json(
      {
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        trialGranted: trialEligible,
        message: cardUsedByDifferentUser
          ? "This payment method was already used for a free trial on another account, so this subscription starts immediately without a trial period."
          : !trialEligible
            ? "You've already used your free trial, so this subscription starts immediately."
            : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
