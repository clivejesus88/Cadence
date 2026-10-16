import { createClient } from "jsr:@supabase/supabase-js@2";

const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") ?? "";
const PAYPAL_PLAN_ID_MONTHLY = Deno.env.get("PAYPAL_PLAN_ID_MONTHLY") ?? "";
const PAYPAL_PLAN_ID_YEARLY = Deno.env.get("PAYPAL_PLAN_ID_YEARLY") ?? "";

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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  const planId = plan === "yearly" ? PAYPAL_PLAN_ID_YEARLY : PAYPAL_PLAN_ID_MONTHLY;
  if (!planId) {
    return new Response("Subscription plan not configured", { status: 503 });
  }

  const origin = new URL(req.url).origin;
  const redirectUrl =
    typeof body.redirectUrl === "string"
      ? body.redirectUrl
      : `${origin}/?paywall=1`;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return new Response("Failed to authenticate with PayPal", { status: 502 });
  }

  const payload = {
    plan_id: planId,
    application_context: {
      brand_name: "Cadence",
      user_action: "SUBSCRIBE_NOW",
      return_url: redirectUrl,
      cancel_url: redirectUrl,
    },
    custom_id: user.id,
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as {
    id?: string;
    status?: string;
    links?: Array<{ rel?: string; href?: string; method?: string }>;
    message?: string;
  };

  if (!res.ok) {
    console.error("[paypal] create subscription failed:", json.message ?? json);
    return new Response("Failed to create subscription", { status: 502 });
  }

  const approvalUrl = json.links?.find((l) => l.rel === "approve")?.href;
  if (!approvalUrl) {
    return new Response("Missing approval URL", { status: 502 });
  }

  // Create pending subscription record
  try {
    await supabase.from("subscriptions").upsert(
      {
        id: json.id ?? `paypal-pending-${user.id}-${Date.now()}`,
        user_id: user.id,
        provider: "paypal",
        status: json.status?.toLowerCase() ?? "pending",
        plan,
        paypal_subscription_id: json.id ?? null,
      },
      { onConflict: "id" }
    );
  } catch (e) {
    console.error("[paypal] failed to upsert pending subscription:", e);
  }

  return new Response(
    JSON.stringify({ url: approvalUrl, subscriptionId: json.id }),
    { headers: { "Content-Type": "application/json" } }
  );
});
