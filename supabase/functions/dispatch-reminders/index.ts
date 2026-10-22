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

// Fixed reminder schedule (local time, hour of day).
const SESSION_REMINDER_HOUR = 16; // 4pm — study nudge
const DAILY_SUMMARY_HOUR = 18; // 6pm — evening recap

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

type SubRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };

function localHour(timezone: string): number | null {
  if (!timezone) return null;
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    const h = parseInt(formatted, 10);
    return Number.isNaN(h) ? null : h % 24;
  } catch {
    return null;
  }
}

function localDateKey(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function sendTo(subs: SubRow[], payload: { title: string; body: string; url?: string; tag?: string }) {
  let sent = 0;
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
        if (status === 404 || status === 410) staleIds.push(sub.id);
        else console.error("[dispatch-reminders] delivery failed:", e);
      }
    })
  );
  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }
  return sent;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return err("Method not allowed", 405);
  }

  const cronSecret = req.headers.get("x-cron-secret") ?? "";
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return err("Unauthorized", 401);
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return err("VAPID keys not configured", 503);
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // Join subscriptions with preferences + profile timezone.
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select(
      "id, user_id, endpoint, p256dh, auth, preferences:preferences!inner(session_reminders, daily_summary), profile:profile!inner(timezone)"
    );

  if (error) {
    console.error("[dispatch-reminders] query failed:", error);
    return err("Query failed", 500);
  }

  type Joined = SubRow & {
    preferences: { session_reminders: boolean; daily_summary: boolean };
    profile: { timezone: string };
  };

  const rows = (data ?? []) as unknown as Joined[];
  let dispatched = 0;

  // Group by user so we send at most one of each reminder per user.
  const byUser = new Map<string, Joined[]>();
  for (const row of rows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row);
    byUser.set(row.user_id, list);
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const [userId, subs] of byUser) {
    const tz = subs[0].profile?.timezone ?? "";
    const prefs = subs[0].preferences;
    const hour = localHour(tz);
    const dateKey = localDateKey(tz);
    if (hour === null) continue;

    const wantSession = Boolean(prefs?.session_reminders) && hour === SESSION_REMINDER_HOUR;
    const wantSummary = Boolean(prefs?.daily_summary) && hour === DAILY_SUMMARY_HOUR;
    if (!wantSession && !wantSummary) continue;

    // Dedupe: skip any reminder we've already logged for this user today.
    const { data: logged } = await supabase
      .from("reminder_log")
      .select("kind")
      .eq("user_id", userId)
      .eq("local_date", dateKey);
    const alreadySent = new Set((logged ?? []).map((r) => r.kind as string));

    const sendSession = wantSession && !alreadySent.has("session");
    const sendSummary = wantSummary && !alreadySent.has("summary");

    if (sendSession) {
      dispatched += await sendTo(subs, {
        title: "Time to focus",
        body: "A short session now keeps your streak alive. Ready?",
        url: "/app/focus",
        tag: `session-${dateKey}`,
      });
      await supabase.from("reminder_log").upsert(
        { user_id: userId, kind: "session", local_date: dateKey },
        { onConflict: "user_id,kind,local_date" }
      );
    }
    if (sendSummary) {
      dispatched += await sendTo(subs, {
        title: "Your day in focus",
        body: "Tap to see how today went and set tomorrow's goal.",
        url: "/app/insights",
        tag: `summary-${dateKey}`,
      });
      await supabase.from("reminder_log").upsert(
        { user_id: userId, kind: "summary", local_date: dateKey },
        { onConflict: "user_id,kind,local_date" }
      );
    }
  }

  return json({ dispatched, date: today });
});
