import { stripe, STRIPE_API_VERSION } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return Response.json({ error: "Missing customerId" }, { status: 400 });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: STRIPE_API_VERSION },
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session", // so we can charge it automatically when the trial ends
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    return Response.json(
      {
        setupIntent: setupIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating SetupIntent:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
