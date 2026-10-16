#!/usr/bin/env node

const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const WEBHOOK_URL = process.env.PAYPAL_WEBHOOK_URL;

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET || !WEBHOOK_URL) {
  console.error("Missing PAYPAL_CLIENT_ID, PAYPAL_SECRET, or PAYPAL_WEBHOOK_URL in env");
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

async function createWebhook(accessToken) {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      event_types: [
        { name: "BILLING.SUBSCRIPTION.ACTIVATED" },
        { name: "BILLING.SUBSCRIPTION.RENEWED" },
        { name: "BILLING.SUBSCRIPTION.CANCELLED" },
        { name: "BILLING.SUBSCRIPTION.EXPIRED" },
        { name: "BILLING.SUBSCRIPTION.SUSPENDED" },
        { name: "PAYMENT.SALE.COMPLETED" },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Create webhook error: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json;
}

async function main() {
  const token = await getAccessToken();
  const webhook = await createWebhook(token);
  console.log(JSON.stringify(webhook, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
