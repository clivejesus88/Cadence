#!/usr/bin/env node

const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.error("Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET in env");
  process.exit(1);
}

const PAYPAL_API_BASE =
  PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Token error: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function createProduct(accessToken, name) {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Create product error: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.id;
}

async function createPlan(accessToken, productId, planName, price, intervalUnit, intervalCount = 1) {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name: planName,
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: String(price),
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Create plan error: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.id;
}

async function main() {
  console.log(`PayPal Mode: ${PAYPAL_MODE}`);
  const token = await getAccessToken();
  console.log("Got access token");
  const productId = await createProduct(token, "Cadence Pro");
  console.log(`Product created: ${productId}`);
  const monthlyId = await createPlan(token, productId, "Cadence Pro Monthly", "6.99", "MONTH");
  console.log(`Monthly plan: ${monthlyId}`);
  const yearlyId = await createPlan(token, productId, "Cadence Pro Yearly", "47.99", "YEAR");
  console.log(`Yearly plan: ${yearlyId}`);
  console.log("\nAdd these to Supabase Edge Function secrets:");
  console.log(`PAYPAL_PLAN_ID_MONTHLY=${monthlyId}`);
  console.log(`PAYPAL_PLAN_ID_YEARLY=${yearlyId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
