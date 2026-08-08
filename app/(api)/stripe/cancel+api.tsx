import { neon } from "@neondatabase/serverless";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const rows = await sql`
      SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ${userId};
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "No subscription found for this user" },
        { status: 404 },
      );
    }

    const subscriptionId = rows[0].stripe_subscription_id;

    // Cancel at period end, not immediately — the user keeps access
    // through whatever they've already paid for (or their trial), and
    // Stripe just won't renew after that.
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await sql`
      UPDATE subscriptions
      SET cancel_at_period_end = true, updated_at = CURRENT_TIMESTAMP
      WHERE stripe_subscription_id = ${subscriptionId};
    `;

    return Response.json(
      {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
