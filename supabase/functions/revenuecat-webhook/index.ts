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

  const { data: seenEvent, error: seenError } = await supabase
    .from("revenuecat_webhook_events")
    .select("event_id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (seenError) {
    console.error("[revenuecat] failed to check duplicate event:", seenError);
    return response("Could not check event", 500);
  }
  if (seenEvent) return response("OK");

  const { data: latestEvents, error: latestError } = await supabase
    .from("revenuecat_webhook_events")
    .select("event_timestamp_ms")
    .eq("user_id", appUserId)
    .order("event_timestamp_ms", { ascending: false })
    .limit(1);
  if (latestError) {
    console.error("[revenuecat] failed to check event order:", latestError);
    return response("Could not check event order", 500);
  }

  const latestTimestamp = Number(latestEvents?.[0]?.event_timestamp_ms ?? 0);
  if (timestamp <= latestTimestamp) {
    const { error } = await supabase.from("revenuecat_webhook_events").insert({
      event_id: eventId,
      user_id: appUserId,
      event_type: eventType,
      event_timestamp_ms: timestamp,
    });
    if (error) {
      console.error("[revenuecat] failed to record stale event:", error);
      return response("Could not record event", 500);
    }
    return response("Ignored stale event");
  }

  const activeEvents = new Set([
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "PRODUCT_CHANGE",
    "SUBSCRIPTION_EXTENDED",
    "NON_RENEWING_PURCHASE",
    "REFUND_REVERSED",
  ]);
  const expiration = eventType === "EXPIRATION";
  if (!expiration && !activeEvents.has(eventType)) {
    const { error } = await supabase.from("revenuecat_webhook_events").insert({
      event_id: eventId,
      user_id: appUserId,
      event_type: eventType,
      event_timestamp_ms: timestamp,
    });
    if (error) {
      console.error("[revenuecat] failed to record ignored event:", error);
      return response("Could not record event", 500);
    }
    return response("Ignored");
  }

  const now = Date.now();
  const status = expiration ? "expired" : "active";
  const { error: profileError } = await supabase
    .from("profile")
    .update(expiration
      ? { plan: "free", member_since: "" }
      : { plan: "pro", member_since: memberSinceLabel(Number(event.purchased_at_ms) || now) })
    .eq("user_id", appUserId);
  if (profileError) {
    console.error("[revenuecat] failed to update profile:", profileError);
    return response("Could not update subscription access", 500);
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
    id: `revenuecat-${appUserId}`,
    user_id: appUserId,
    provider: "revenuecat",
    status,
    plan: planFromProduct(event.product_id),
    external_subscription_id: typeof event.original_transaction_id === "string"
      ? event.original_transaction_id
      : typeof event.transaction_id === "string"
        ? event.transaction_id
        : null,
    current_period_end: Number(event.expiration_at_ms) || null,
    cancelled_at: expiration ? now : null,
    last_event_at: timestamp,
    updated_at: now,
  }, { onConflict: "id" });
  if (subscriptionError) {
    console.error("[revenuecat] failed to update subscription record:", subscriptionError);
    return response("Could not record subscription", 500);
  }

  const { error: recordError } = await supabase.from("revenuecat_webhook_events").insert({
    event_id: eventId,
    user_id: appUserId,
    event_type: eventType,
    event_timestamp_ms: timestamp,
  });
  if (recordError) {
    console.error("[revenuecat] failed to record processed event:", recordError);
    return response("Could not record event", 500);
  }

  return response("OK");
});
