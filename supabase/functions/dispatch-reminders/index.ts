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
const TASK_REMINDER_HOUR = 16; // 4pm — due/overdue task nudge
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
  let failed = 0;
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
        else {
          failed += 1;
          console.error("[dispatch-reminders] delivery failed:", e);
        }
      }
    })
  );
  if (staleIds.length > 0) {
    const { error } = await supabase.from("push_subscriptions").delete().in("id", staleIds);
    if (error) {
      console.error("[dispatch-reminders] failed to prune expired subscriptions:", error);
    }
  }
  return { sent, failed };
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

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");

  if (subscriptionsError) {
    console.error("[dispatch-reminders] loading subscriptions failed:", subscriptionsError);
    return err("Query failed", 500);
  }

  const userIds = [...new Set((subscriptions ?? []).map((sub) => sub.user_id))];
  if (userIds.length === 0) return json({ dispatched: 0, date: new Date().toISOString().slice(0, 10) });

  const [{ data: preferences, error: preferencesError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase
        .from("preferences")
        .select("user_id, session_reminders, task_reminders, daily_summary")
        .in("user_id", userIds),
      supabase
        .from("profile")
        .select("user_id, timezone")
        .in("user_id", userIds),
    ]);

  if (preferencesError || profilesError) {
    console.error("[dispatch-reminders] loading user settings failed:", {
      preferencesError,
      profilesError,
    });
    return err("Could not load user settings", 500);
  }

  type Joined = SubRow & {
    preferences: { session_reminders: boolean; task_reminders: boolean; daily_summary: boolean };
    profile: { timezone: string };
  };

  const preferenceByUser = new Map((preferences ?? []).map((row) => [row.user_id, row]));
  const profileByUser = new Map((profiles ?? []).map((row) => [row.user_id, row]));
  const rows: Joined[] = (subscriptions ?? []).flatMap((sub) => {
    const userPreferences = preferenceByUser.get(sub.user_id);
    const userProfile = profileByUser.get(sub.user_id);
    if (!userPreferences || !userProfile) return [];
    return [{
      ...sub,
      preferences: {
        session_reminders: userPreferences.session_reminders,
        task_reminders: userPreferences.task_reminders,
        daily_summary: userPreferences.daily_summary,
      },
      profile: { timezone: userProfile.timezone },
    }];
  });
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

    const wantSession = Boolean(prefs?.session_reminders) && hour >= SESSION_REMINDER_HOUR;
    const wantTasks = Boolean(prefs?.task_reminders) && hour >= TASK_REMINDER_HOUR;
    const wantSummary = Boolean(prefs?.daily_summary) && hour >= DAILY_SUMMARY_HOUR;
    if (!wantSession && !wantTasks && !wantSummary) continue;

    // Dedupe: skip any reminder we've already logged for this user today.
    const { data: logged, error: logError } = await supabase
      .from("reminder_log")
      .select("kind")
      .eq("user_id", userId)
      .eq("local_date", dateKey);
    if (logError) {
      console.error("[dispatch-reminders] failed to check reminder log:", logError);
      return err("Could not check reminder log", 500);
    }
    const alreadySent = new Set((logged ?? []).map((r) => r.kind as string));

    const shouldCheckSessions =
      (wantSession && !alreadySent.has("session")) ||
      (wantSummary && !alreadySent.has("summary"));
    let completedSessions: { duration_minutes: number }[] = [];
    if (shouldCheckSessions) {
      const { data: sessionRows, error: sessionError } = await supabase
        .from("focus_sessions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .eq("date", dateKey)
        .eq("type", "focus")
        .eq("completed", true)
        .eq("deleted", false);
      if (sessionError) {
        console.error("[dispatch-reminders] failed to load today's sessions:", sessionError);
        return err("Could not load today's sessions", 500);
      }
      completedSessions = sessionRows ?? [];
    }

    const sendSession =
      wantSession && !alreadySent.has("session") && completedSessions.length === 0;
    const sendTasks = wantTasks && !alreadySent.has("tasks");
    const sendSummary =
      wantSummary && !alreadySent.has("summary") && completedSessions.length > 0;

    if (sendTasks) {
      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("title,due_date")
        .eq("user_id", userId)
        .eq("completed", false)
        .eq("deleted", false)
        .neq("due_date", "")
        .lte("due_date", dateKey)
        .order("due_date", { ascending: true })
        .limit(100);
      if (taskError) {
        console.error("[dispatch-reminders] failed to load due tasks:", taskError);
        return err("Could not load due tasks", 500);
      }
      if (tasks?.length) {
        const overdue = tasks.filter((task) => task.due_date < dateKey).length;
        const dueToday = tasks.length - overdue;
        const dueText = [
          overdue ? `${overdue} overdue` : "",
          dueToday ? `${dueToday} due today` : "",
        ].filter(Boolean).join(" · ");
        const title = String(tasks[0].title ?? "").slice(0, 100);
        const result = await sendTo(subs, {
          title: "Tasks to do today",
          body: `${dueText}${title ? ` — first up: ${title}` : ""}`,
          url: "/app/planner",
          tag: `tasks-${dateKey}`,
        });
        dispatched += result.sent;
        if (result.sent > 0 && result.failed === 0) {
          const { error } = await supabase.from("reminder_log").upsert(
            { user_id: userId, kind: "tasks", local_date: dateKey },
            { onConflict: "user_id,kind,local_date" }
          );
          if (error) {
            console.error("[dispatch-reminders] failed to record task reminder:", error);
            return err("Could not record task reminder", 500);
          }
        }
      }
    }

    if (sendSession) {
      const result = await sendTo(subs, {
        title: "Time to focus",
        body: "A short session now keeps your streak alive. Ready?",
        url: "/app/focus",
        tag: `session-${dateKey}`,
      });
      dispatched += result.sent;
      if (result.sent > 0 && result.failed === 0) {
        const { error } = await supabase.from("reminder_log").upsert(
          { user_id: userId, kind: "session", local_date: dateKey },
          { onConflict: "user_id,kind,local_date" }
        );
        if (error) {
          console.error("[dispatch-reminders] failed to record session reminder:", error);
          return err("Could not record session reminder", 500);
        }
      }
    }
    if (sendSummary) {
      const totalMinutes = completedSessions.reduce(
        (sum, session) => sum + Number(session.duration_minutes || 0),
        0,
      );
      const result = await sendTo(subs, {
        title: "Your day in focus",
        body: `You focused for ${totalMinutes} minutes across ${completedSessions.length} session${completedSessions.length === 1 ? "" : "s"}. Tap to see your day.`,
        url: "/app/insights",
        tag: `summary-${dateKey}`,
      });
      dispatched += result.sent;
      if (result.sent > 0 && result.failed === 0) {
        const { error } = await supabase.from("reminder_log").upsert(
          { user_id: userId, kind: "summary", local_date: dateKey },
          { onConflict: "user_id,kind,local_date" }
        );
        if (error) {
          console.error("[dispatch-reminders] failed to record summary reminder:", error);
          return err("Could not record summary reminder", 500);
        }
      }
    }
  }

  return json({ dispatched, date: today });
});
