import "npm:@sentry/deno/import";
import * as Sentry from "npm:@sentry/deno";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") ?? "" });

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@cadence.app";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

// Sliding-window limiter backed by public.check_rate_limit (migration 009).
async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
  lockMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_ms: windowMs,
      p_lock_ms: lockMs,
    });
    if (error) {
      console.error("[rate-limit] rpc error:", error);
      return { allowed: true, retryAfterMs: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: Boolean(row?.allowed), retryAfterMs: Number(row?.retry_after_ms ?? 0) };
  } catch (e) {
    console.error("[rate-limit] unexpected error:", e);
    return { allowed: true, retryAfterMs: 0 };
  }
}

async function sendToSubscriptions(
  subs: PushSubscriptionRow[],
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<{ sent: number; pruned: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  let sent = 0;
  let pruned = 0;
  const staleIds: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url ?? "/",
            tag: payload.tag ?? "cadence",
          })
        );
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          staleIds.push(sub.id);
        } else {
          console.error("[send-push] delivery failed:", e);
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
    pruned = staleIds.length;
  }

  return { sent, pruned };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return err("Method not allowed", 405);
  }

  // Internal-only: require the shared cron secret.
  const cronSecret = req.headers.get("x-cron-secret") ?? "";
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return err("Unauthorized", 401);
  }

  let body: { userId?: string; title?: string; body?: string; url?: string; tag?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  if (!body.userId || !body.title) {
    return err("userId and title are required", 400);
  }

  // Cap outbound push per user (e.g. 30/min) so a bug or abuse can't spam them.
  const limit = await rateLimit(`send-push:${body.userId}`, 30, 60_000, 60_000);
  if (!limit.allowed) {
    return new Response("Too many requests", {
      status: 429,
      headers: { ...CORS_HEADERS, "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
    });
  }

  // Bound and sanitize free-text fields before they reach a notification.
  const title = String(body.title).slice(0, 120);
  const message = String(body.body ?? "").slice(0, 300);
  const url = typeof body.url === "string" && /^\/[^\s]*$/.test(body.url) ? body.url : "/";
  const tag = typeof body.tag === "string" ? body.tag.slice(0, 60) : undefined;

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("user_id", body.userId);

  if (error) {
    console.error("[send-push] load subscriptions failed:", error);
    return err("Failed to load subscriptions", 500);
  }

  try {
    const result = await sendToSubscriptions((data ?? []) as PushSubscriptionRow[], {
      title,
      body: message,
      url,
      tag,
    });
    return json(result);
  } catch (e) {
    console.error("[send-push] send failed:", e);
    return err("Failed to send", 502);
  }
});
