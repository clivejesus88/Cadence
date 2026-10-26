import "npm:@sentry/deno/import";
import * as Sentry from "npm:@sentry/deno";
import { createClient } from "jsr:@supabase/supabase-js@2";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") ?? "" });

const authorization = Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION") ?? "";
const proEntitlementId = Deno.env.get("REVENUECAT_PRO_ENTITLEMENT_ID") ?? "pro";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

function response(body: string, status = 200): Response {
  return new Response(body, { status });
}

function isUserId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function memberSinceLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function planFromProduct(productId: unknown): "monthly" | "yearly" {
  const product = typeof productId === "string" ? productId.toLowerCase() : "";
  return product.includes("annual") || product.includes("year") ? "yearly" : "monthly";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return response("Method not allowed", 405);
  if (!authorization) {
    console.error("[revenuecat] webhook authorization is not configured");
    return response("Webhook authorization is not configured", 503);
  }
  if (req.headers.get("authorization") !== authorization) {
    return response("Unauthorized", 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return response("Invalid JSON", 400);
  }
  const event = (payload.event ?? {}) as Record<string, unknown>;
  const eventId = typeof event.id === "string" ? event.id : "";
  const eventType = typeof event.type === "string" ? event.type : "";
  const appUserId = event.app_user_id;
  const timestamp = Number(event.event_timestamp_ms);
  if (!eventId || !eventType || !Number.isFinite(timestamp) || !isUserId(appUserId)) {
    return response("Invalid event", 400);
  }
  if (eventType === "TEST") return response("OK");

  const entitlementIds = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids.filter((id): id is string => typeof id === "string")
    : typeof event.entitlement_id === "string"
      ? [event.entitlement_id]
      : [];
  if (!entitlementIds.includes(proEntitlementId)) return response("Ignored");

  const purchasedAt = Number(event.purchased_at_ms) || Date.now();
  const plan = planFromProduct(event.product_id);
  const externalSubscriptionId = typeof event.original_transaction_id === "string"
    ? event.original_transaction_id
    : typeof event.transaction_id === "string"
      ? event.transaction_id
      : null;
  const expirationAt = Number(event.expiration_at_ms) || 0;

  const { data: result, error } = await supabase.rpc("process_revenuecat_event", {
    p_event_id: eventId,
    p_user_id: appUserId,
    p_event_type: eventType,
    p_event_timestamp_ms: timestamp,
    p_plan: plan,
    p_external_subscription_id: externalSubscriptionId,
    p_expiration_at_ms: expirationAt,
    p_member_since: memberSinceLabel(purchasedAt),
  });
  if (error) {
    console.error("[revenuecat] failed to atomically process event:", error);
    return response("Could not process subscription event", 500);
  }
  if (result === "processed" || result === "duplicate" || result === "stale" || result === "ignored") {
    return response(result === "stale" ? "Ignored stale event" : "OK");
  }

  console.error("[revenuecat] unexpected event processing result:", result);
  return response("Could not process subscription event", 500);
});
