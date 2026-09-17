import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db, SyncTableName, SyncStateRow } from './db';
import { getSyncUserId } from './repo';
import { TaskRow, SessionRow, PreferencesRow, ProfileRow } from './db';

type RemoteTable = 'tasks' | 'focus_sessions' | 'preferences' | 'profile';

const PULL_PAGE_SIZE = 1000;

function remoteTableName(table: SyncTableName): RemoteTable {
  return table === 'focusSessions' ? 'focus_sessions' : (table as RemoteTable);
}

function taskToRemote(row: TaskRow, uid: string): Record<string, unknown> {
  return {
    id: row.id,
    user_id: uid,
    title: row.title,
    subject: row.subject,
    estimated_pomodoros: row.estimatedPomodoros,
    completed_pomodoros: row.completedPomodoros,
    due_date: row.dueDate,
    completed: row.completed,
    deleted: row.deleted,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

function sessionToRemote(row: SessionRow, uid: string): Record<string, unknown> {
  return {
    id: row.id,
    user_id: uid,
    date: row.date,
    duration_minutes: row.durationMinutes,
    type: row.type,
    completed: row.completed,
    task_id: row.taskId ?? null,
    deleted: row.deleted,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

function preferencesToRemote(row: PreferencesRow, uid: string): Record<string, unknown> {
  return {
    user_id: uid,
    default_duration: row.value.defaultDuration,
    break_length: row.value.breakLength,
    auto_start_breaks: row.value.autoStartBreaks,
    session_reminders: row.value.sessionReminders,
    daily_summary: row.value.dailySummary,
    block_during_focus: row.value.blockDuringFocus,
    strict_mode: row.value.strictMode,
    updated_at: row.updatedAt
  };
}

function profileToRemote(row: ProfileRow, uid: string): Record<string, unknown> {
  return {
    user_id: uid,
    name: row.value.name,
    email: row.value.email,
    school: row.value.school,
    avatar_url: row.value.avatarUrl,
    plan: row.value.plan,
    member_since: row.value.memberSince,
    updated_at: row.updatedAt
  };
}

function toRemotePayload(table: SyncTableName, payload: unknown, uid: string): Record<string, unknown> {
  switch (table) {
    case 'tasks': return taskToRemote(payload as TaskRow, uid);
    case 'focusSessions': return sessionToRemote(payload as SessionRow, uid);
    case 'preferences': return preferencesToRemote(payload as PreferencesRow, uid);
    case 'profile': return profileToRemote(payload as ProfileRow, uid);
  }
}

async function pushOutbox(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const uid = getSyncUserId();
  if (!uid) return;

  const entries = await db.syncQueue.orderBy('updatedAt').toArray();
  for (const entry of entries) {
    if (entry.userId !== uid) continue;
    try {
      const table = remoteTableName(entry.table);
      if (entry.op === 'delete') {
        const keyCol = entry.table === 'preferences' || entry.table === 'profile' ? 'user_id' : 'id';
        await supabase.from(table).delete().eq(keyCol, entry.entityId);
      } else {
        const payload = toRemotePayload(entry.table, entry.payload, uid);
        const onConflict = entry.table === 'preferences' || entry.table === 'profile' ? 'user_id' : 'id';
        await supabase.from(table).upsert(payload, { onConflict });
      }
      await db.syncQueue.delete(entry.id!);
    } catch (err) {
      console.error('[sync] push failed, will retry:', err);
      break;
    }
  }
}

// LWW apply: a local row always wins ties, so we only replace when the remote copy is strictly newer.
async function applyRemote(remote: Record<string, unknown>): Promise<void> {
  const id = String(remote.id);
  if ('title' in remote) {
    const existing = await db.tasks.get(id);
    const updatedAt = Number(remote.updated_at);
    if (existing && existing.updatedAt >= updatedAt) return;
    if (remote.deleted) {
      await db.tasks.delete(id);
      return;
    }
    await db.tasks.put({
      id,
      userId: String(remote.user_id),
      title: String(remote.title),
      subject: String(remote.subject),
      estimatedPomodoros: Number(remote.estimated_pomodoros),
      completedPomodoros: Number(remote.completed_pomodoros),
      dueDate: String(remote.due_date),
      completed: Boolean(remote.completed),
      deleted: Boolean(remote.deleted),
      createdAt: Number(remote.created_at),
      updatedAt
    });
  } else if ('duration_minutes' in remote) {
    const existing = await db.focusSessions.get(id);
    const updatedAt = Number(remote.updated_at);
    if (existing && existing.updatedAt >= updatedAt) return;
    if (remote.deleted) {
      await db.focusSessions.delete(id);
      return;
    }
    await db.focusSessions.put({
      id,
      userId: String(remote.user_id),
      date: String(remote.date),
      durationMinutes: Number(remote.duration_minutes),
      type: (remote.type as 'focus' | 'break') ?? 'focus',
      completed: Boolean(remote.completed),
      taskId: remote.task_id ? String(remote.task_id) : undefined,
      deleted: Boolean(remote.deleted),
      createdAt: Number(remote.created_at),
      updatedAt
    });
  } else if ('default_duration' in remote) {
    const uid = String(remote.user_id);
    const updatedAt = Number(remote.updated_at);
    const existing = await db.preferences.get(uid);
    if (existing && existing.updatedAt >= updatedAt) return;
    await db.preferences.put({
      key: uid,
      value: {
        defaultDuration: Number(remote.default_duration),
        breakLength: Number(remote.break_length),
        autoStartBreaks: Boolean(remote.auto_start_breaks),
        sessionReminders: Boolean(remote.session_reminders),
        dailySummary: Boolean(remote.daily_summary),
        blockDuringFocus: Boolean(remote.block_during_focus),
        strictMode: Boolean(remote.strict_mode)
      },
      updatedAt,
      deleted: false
    });
  } else {
    const uid = String(remote.user_id);
    const updatedAt = Number(remote.updated_at);
    const existing = await db.profile.get(uid);
    if (existing && existing.updatedAt >= updatedAt) return;
    await db.profile.put({
      key: uid,
      value: {
        id: uid,
        name: String(remote.name ?? ''),
        email: String(remote.email ?? ''),
        school: String(remote.school ?? ''),
        avatarUrl: String(remote.avatar_url ?? defaultAvatar()),
        plan: (remote.plan as 'free' | 'pro') ?? 'free',
        memberSince: String(remote.member_since ?? '')
      },
      updatedAt,
      deleted: false
    });
  }
}

function defaultAvatar(): string {
  return '/41934678-ca28-4660-a31a-3e5350bae9d7.jpg';
}

async function pullTable(table: SyncTableName): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const uid = getSyncUserId();
  if (!uid) return;

  const watermarkKey = `${uid}|${table}`;
  const state = await db.syncState.get(watermarkKey);
  let watermark = state?.lastWatermark ?? 0;
  const remote = remoteTableName(table);

  for (;;) {
    const { data, error } = await supabase
      .from(remote)
      .select('*')
      .eq('user_id', uid)
      .gt('updated_at', watermark)
      .order('updated_at', { ascending: true })
      .limit(PULL_PAGE_SIZE);

    if (error) {
      console.error(`[sync] pull ${table} failed:`, error);
      return;
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    let pageMax = watermark;
    for (const row of rows) {
      await applyRemote(row);
      const ts = Number(row.updated_at);
      if (ts > pageMax) pageMax = ts;
    }
    if (pageMax > watermark) {
      watermark = pageMax;
      const nextRow: SyncStateRow = { key: watermarkKey, lastWatermark: watermark };
      await db.syncState.put(nextRow);
    }
    if (rows.length < PULL_PAGE_SIZE) break;
  }
}

async function pullChanges(): Promise<void> {
  const tables: SyncTableName[] = ['tasks', 'focusSessions', 'preferences', 'profile'];
  for (const table of tables) {
    await pullTable(table);
  }
}

export async function runSync(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = getSyncUserId();
  if (!uid) return;
  try {
    await pushOutbox();
    await pullChanges();
  } catch (err) {
    console.error('[sync] run failed:', err);
  }
}

let syncTimer: ReturnType<typeof setTimeout> | undefined;

export function scheduleSync(delayMs = 800): void {
  if (syncTimer !== undefined) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void runSync();
  }, delayMs);
}

export function initSync(): () => void {
  const onOnline = () => void runSync();
  window.addEventListener('online', onOnline);
  void runSync();
  return () => window.removeEventListener('online', onOnline);
}