import { Stripe } from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

// Must match the version literal your installed `stripe` package's types
// expect. If this ever fails to typecheck after `npm update stripe`, the
// TS2322 error tells you the exact new string to put here.
export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});
