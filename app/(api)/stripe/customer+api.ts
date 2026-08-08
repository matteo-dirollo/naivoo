import { neon } from "@neondatabase/serverless";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { userId, name, email } = await request.json();

    if (!userId || !email) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const existing = await sql`
      SELECT stripe_customer_id FROM stripe_customers WHERE user_id = ${userId};
    `;

    if (existing.length > 0) {
      return Response.json(
        { customerId: existing[0].stripe_customer_id },
        { status: 200 },
      );
    }

    const customer = await stripe.customers.create({
      name,
      email,
      metadata: { clerk_id: userId },
    });

    await sql`
      INSERT INTO stripe_customers (user_id, stripe_customer_id)
      VALUES (${userId}, ${customer.id});
    `;

    return Response.json({ customerId: customer.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
