/**
 * One-time setup script — creates the Naivoo Pro product and its
 * €6.99/month price (with a 15-day default trial) in your Stripe account.
 *
 * Run once per Stripe environment (test mode, then again in live mode
 * when you're ready to launch).
 *
 * Usage:
 *   npm install stripe --save-dev   (if not already a dependency)
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe.ts
 *
 * Safe to re-run: it checks for an existing "Naivoo Pro" product/price
 * before creating new ones, so you won't end up with duplicates.
 */

const Stripe = require("stripe");

const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const PRODUCT_NAME = "Naivoo Pro";
const PRICE_AMOUNT_CENTS = 699; // 6.99 EUR
const CURRENCY = "eur";
const TRIAL_DAYS = 15;

if (!SECRET_KEY) {
  console.error(
    "Missing STRIPE_SECRET_KEY. Run with:\n" +
      "  STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe.ts",
  );
  process.exit(1);
}

if (SECRET_KEY.startsWith("sk_live_")) {
  console.warn(
    "\n⚠️  You're using a LIVE secret key. This will create a real product " +
      "in your live Stripe account.\n",
  );
}

const stripe = new Stripe(SECRET_KEY);

async function findExistingProduct() {
  const products = await stripe.products.search({
    query: `name:"${PRODUCT_NAME}"`,
  });
  return products.data[0] ?? null;
}

async function findExistingPrice(productId) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 10,
  });
  return (
    prices.data.find(
      (p) =>
        p.unit_amount === PRICE_AMOUNT_CENTS &&
        p.currency === CURRENCY &&
        p.recurring?.interval === "month",
    ) ?? null
  );
}

async function main() {
  let product = await findExistingProduct();

  if (product) {
    console.log(`Found existing product: ${product.id} (${product.name})`);
  } else {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: "Naivoo full app access — trip planning and navigation",
    });
    console.log(`Created product: ${product.id}`);
  }

  let price = await findExistingPrice(product.id);

  if (price) {
    console.log(`Found existing matching price: ${price.id}`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      currency: CURRENCY,
      unit_amount: PRICE_AMOUNT_CENTS,
      recurring: {
        interval: "month",
        trial_period_days: TRIAL_DAYS,
      },
      nickname: "Naivoo Pro monthly (EUR)",
    });
    console.log(`Created price: ${price.id}`);
  }

  console.log("\n✅ Done. Add this to your .env:\n");
  console.log(`STRIPE_PRICE_ID=${price.id}`);
  console.log(
    `\n(Product: ${product.id} — €${(PRICE_AMOUNT_CENTS / 100).toFixed(
      2,
    )}/month, ${TRIAL_DAYS}-day trial)`,
  );
}

main().catch((err) => {
  console.error("Stripe setup failed:", err.message);
  process.exit(1);
});
