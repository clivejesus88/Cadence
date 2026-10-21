import "npm:@sentry/deno/import";
import * as Sentry from "npm:@sentry/deno";
import { createClient } from "jsr:@supabase/supabase-js@2";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN") ?? "",
});

const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") ?? "";
const PAYPAL_WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID") ?? "";

const PAYPAL_API_BASE =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

async function getAccessToken(): Promise<string | null> {
  try {
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
    const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

function memberSinceLabel(raw: unknown): string {
  let ts: number;
  if (typeof raw === "number") {
    ts = raw < 1e12 ? raw * 1000 : raw;
  } else if (typeof raw === "string") {
    ts = Date.parse(raw);
  } else {
    ts = Date.now();
  }
  if (Number.isNaN(ts)) ts = Date.now();
  return new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const bodyText = await req.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Always verify webhook signature — fail CLOSED if anything is wrong.
  if (!PAYPAL_WEBHOOK_ID || !PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    console.error("[paypal] webhook verification not configured; rejecting");
    return new Response("Webhook verification not configured", { status: 503 });
  }

  const headers = req.headers;
  const transmissionId = headers.get("paypal-transmission-id") ?? "";
  const transmissionTime = headers.get("paypal-transmission-time") ?? "";
  const transmissionSig = headers.get("paypal-transmission-sig") ?? "";
  const certUrl = headers.get("paypal-cert-url") ?? "";
  const authAlgo = headers.get("paypal-auth-algo") ?? "";

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error("[paypal] could not get PayPal access token for verification");
    return new Response("Verification unavailable", { status: 503 });
  }
  try {
    const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: payload,
      }),
    });
    const verifyJson = (await verifyRes.json()) as { verification_status?: string };
    if (verifyJson.verification_status !== "SUCCESS") {
      console.warn("[paypal] webhook signature verification failed");
      return new Response("Invalid signature", { status: 401 });
    }
  } catch (e) {
    console.error("[paypal] webhook verify error:", e);
    return new Response("Verification failed", { status: 401 });
  }

  const eventType = String(payload.event_type ?? payload.event ?? "");
  const resource = (payload.resource ?? {}) as Record<string, unknown>;
  const customId = typeof resource.custom_id === "string" ? resource.custom_id : undefined;
  const subscriptionId =
    typeof resource.id === "string"
      ? resource.id
      : typeof (resource as any).subscription_id === "string"
        ? (resource as any).subscription_id
        : typeof (resource as any).billing_agreement_id === "string"
          ? (resource as any).billing_agreement_id
          : undefined;

  // Prefer the signed custom_id; otherwise resolve the owner from our DB using
  // the PayPal subscription id (e.g. PAYMENT.SALE.COMPLETED has no custom_id).
  let userId = customId;
  if (!userId && subscriptionId) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paypal_subscription_id", subscriptionId)
      .maybeSingle();
    if (sub?.user_id) userId = sub.user_id as string;
  }

  const now = Date.now();
  const applyPro = async () => {
    if (!userId) return;
    try {
      await supabase
        .from("profile")
        .update({ plan: "pro", member_since: memberSinceLabel(now) })
        .eq("user_id", userId);
      await supabase
        .from("subscriptions")
        .upsert(
          {
            id: subscriptionId ?? `sub-${userId}-${now}`,
            user_id: userId,
            provider: "paypal",
            status: "active",
            paypal_subscription_id: subscriptionId ?? null,
            updated_at: now,
          },
          { onConflict: "id" }
        );
    } catch (e) {
      console.error("[paypal] applyPro error:", e);
    }
  };

  const applyFree = async () => {
    if (!userId) return;
    try {
      await supabase
        .from("profile")
        .update({ plan: "free", member_since: "" })
        .eq("user_id", userId);
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: now, updated_at: now })
        .eq("user_id", userId)
        .eq("provider", "paypal");
    } catch (e) {
      console.error("[paypal] applyFree error:", e);
    }
  };

  switch (eventType) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RENEWED":
    case "PAYMENT.SALE.COMPLETED":
      await applyPro();
      return new Response("OK", { status: 200 });
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      await applyFree();
      return new Response("OK", { status: 200 });
    default:
      return new Response("Ignored", { status: 200 });
  }
});
