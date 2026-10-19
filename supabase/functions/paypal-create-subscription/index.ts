import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import { createClient } from "jsr:@supabase/supabase-js@2";

Sentry.init({
  dsn: "https://7ea99e2c5dda2c502de6d9817be5c06c@o4512283907981312.ingest.de.sentry.io/4512284060287056",
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(message: string, status: number): Response {
  return new Response(message, { status, headers: CORS_HEADERS });
}

const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") ?? "";
const PAYPAL_PLAN_ID_MONTHLY = Deno.env.get("PAYPAL_PLAN_ID_MONTHLY") ?? "";
const PAYPAL_PLAN_ID_YEARLY = Deno.env.get("PAYPAL_PLAN_ID_YEARLY") ?? "";

// Comma-separated allowlist of origins permitted as PayPal return/cancel URLs.
// Defaults to localhost for development. Set ALLOWED_REDIRECT_ORIGINS in prod.
const ALLOWED_REDIRECT_ORIGINS = (Deno.env.get("ALLOWED_REDIRECT_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedRedirect(raw: string): string | null {
  try {
    const u = new URL(raw);
    const origin = u.origin;
    if (ALLOWED_REDIRECT_ORIGINS.length === 0) {
      // Dev fallback: localhost only.
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return raw;
      return null;
    }
    return ALLOWED_REDIRECT_ORIGINS.includes(origin) ? raw : null;
  } catch {
    return null;
  }
}

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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return err("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return err("Unauthorized", 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  const planId = plan === "yearly" ? PAYPAL_PLAN_ID_YEARLY : PAYPAL_PLAN_ID_MONTHLY;
  if (!planId) {
    return err("Subscription plan not configured", 503);
  }

  // Prevent duplicate active subscriptions for the same user.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .eq("provider", "paypal")
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (existing) {
    return err("Already subscribed", 409);
  }

  const fallbackOrigin = new URL(req.url).origin;
  const requestedRedirect =
    typeof body.redirectUrl === "string"
      ? isAllowedRedirect(body.redirectUrl)
      : null;
  if (typeof body.redirectUrl === "string" && !requestedRedirect) {
    return err("Redirect URL not allowed", 400);
  }
  const redirectUrl = requestedRedirect ?? `${fallbackOrigin}/?paywall=1`;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return err("Failed to authenticate with PayPal", 502);
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

  const ppJson = (await res.json()) as {
    id?: string;
    status?: string;
    links?: Array<{ rel?: string; href?: string; method?: string }>;
    message?: string;
  };

  if (!res.ok) {
    console.error("[paypal] create subscription failed:", ppJson.message ?? ppJson);
    return err("Failed to create subscription", 502);
  }

  const approvalUrl = ppJson.links?.find((l) => l.rel === "approve")?.href;
  if (!approvalUrl) {
    return err("Missing approval URL", 502);
  }

  // Create pending subscription record
  try {
    await supabase.from("subscriptions").upsert(
      {
        id: ppJson.id ?? `paypal-pending-${user.id}-${Date.now()}`,
        user_id: user.id,
        provider: "paypal",
        status: ppJson.status?.toLowerCase() ?? "pending",
        plan,
        paypal_subscription_id: ppJson.id ?? null,
      },
      { onConflict: "id" }
    );
  } catch (e) {
    console.error("[paypal] failed to upsert pending subscription:", e);
  }

  return json({ url: approvalUrl, subscriptionId: ppJson.id });
});
