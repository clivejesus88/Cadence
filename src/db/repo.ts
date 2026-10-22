import { format } from 'date-fns';
import { db, SyncTableName, SyncQueueRow } from './db';
import { Task } from '../types/task';
import { FocusSession } from '../types/session';
import { UserProfile, Preferences, defaultPreferences, defaultProfile } from '../types/user';
import { sanitizeText, sanitizeEmail, sanitizeAvatarUrl, sanitizeBlockingRules } from '../utils/sanitize';

const seedIds = new Set<string>();

let userId: string | null = null;

export function setSyncUserId(id: string | null): void {
  userId = id;
}

export function getSyncUserId(): string | null {
  return userId;
}

function makeId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function enqueueOutbox(table: SyncTableName, entityId: string, op: SyncQueueRow['op'], payload?: unknown): void {
  void db.syncQueue.add({ table, entityId, op, payload, userId, updatedAt: Date.now() });
}

const newRowCommon = (now: number) => ({ userId, createdAt: now, updatedAt: now, deleted: false });

function sanitizeTaskInput(input: Omit<Task, 'id' | 'completedPomodoros' | 'completed'>) {
  return {
    ...input,
    title: sanitizeText(input.title, 140) || 'Untitled task',
    subject: sanitizeText(input.subject, 60) || 'General',
    estimatedPomodoros: clampInt(input.estimatedPomodoros, 1, 20),
    dueDate: sanitizeText(input.dueDate, 10)
  };
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export async function addTask(input: Omit<Task, 'id' | 'completedPomodoros' | 'completed'>): Promise<Task> {
  const now = Date.now();
  const row = { ...sanitizeTaskInput(input), id: makeId('t'), completedPomodoros: 0, completed: false, ...newRowCommon(now) };
  await db.tasks.put(row);
  enqueueOutbox('tasks', row.id, 'upsert', row);
  return row;
}

export async function toggleTask(id: string): Promise<void> {
  const existing = await db.tasks.get(id);
  if (!existing) return;
  const next = { ...existing, completed: !existing.completed, updatedAt: Date.now() };
  await db.tasks.put(next);
  enqueueOutbox('tasks', id, 'upsert', next);
}

async function incrementCompletedPomodoros(taskId: string, delta: number): Promise<void> {
  const existing = await db.tasks.get(taskId);
  if (!existing) return;
  const next = { ...existing, completedPomodoros: existing.completedPomodoros + delta, updatedAt: Date.now() };
  await db.tasks.put(next);
  enqueueOutbox('tasks', taskId, 'upsert', next);
}

export async function logSession(durationMinutes: number, taskId?: string): Promise<FocusSession> {
  const now = Date.now();
  const row = {
    id: makeId('s'),
    date: format(new Date(), 'yyyy-MM-dd'),
    durationMinutes,
    type: 'focus' as const,
    completed: true,
    taskId,
    ...newRowCommon(now)
  };
  await db.focusSessions.put(row);
  enqueueOutbox('focusSessions', row.id, 'upsert', row);
  if (taskId) await incrementCompletedPomodoros(taskId, 1);
  return row;
}

export async function updatePreferences(patch: Partial<Preferences>): Promise<void> {
  const key = userId ?? 'local';
  const existing = await db.preferences.get(key);
  const now = Date.now();
  const safe: Partial<Preferences> = { ...patch };
  if (patch.defaultDuration !== undefined) safe.defaultDuration = clampInt(patch.defaultDuration, 1, 180);
  if (patch.breakLength !== undefined) safe.breakLength = clampInt(patch.breakLength, 1, 60);
  if (patch.dailyGoalMinutes !== undefined) safe.dailyGoalMinutes = clampInt(patch.dailyGoalMinutes, 5, 720);
  if (patch.blockingRules !== undefined) safe.blockingRules = sanitizeBlockingRules(patch.blockingRules);
  const value = { ...defaultPreferences, ...(existing?.value ?? {}), ...safe };
  const row = { key, value, updatedAt: now, deleted: false };
  await db.preferences.put(row);
  enqueueOutbox('preferences', key, 'upsert', row);
}

export async function updateProfile(patch: Partial<UserProfile>): Promise<void> {
  const key = userId ?? 'local';
  const existing = await db.profile.get(key);
  const now = Date.now();
  // plan/memberSince are server-authoritative (see migration 005) and must never
  // originate from the client store.
  const { plan: _plan, memberSince: _memberSince, ...rest } = patch;
  void _plan;
  void _memberSince;
  const safe: Partial<UserProfile> = { ...rest };
  if (rest.name !== undefined) safe.name = sanitizeText(rest.name, 60);
  if (rest.school !== undefined) safe.school = sanitizeText(rest.school, 80);
  if (rest.email !== undefined) safe.email = sanitizeEmail(rest.email);
  if (rest.avatarUrl !== undefined) safe.avatarUrl = sanitizeAvatarUrl(rest.avatarUrl);
  if (rest.timezone !== undefined) safe.timezone = sanitizeText(rest.timezone, 64);
  const value = { ...defaultProfile, ...(existing?.value ?? {}), ...safe, id: key };
  const row = { key, value, updatedAt: now, deleted: false };
  await db.profile.put(row);
  enqueueOutbox('profile', key, 'upsert', row);
}

export function markNudgeSeen(key: string, day: string): void {
  localStorage.setItem(`cadence.nudge.${key}`, day);
}

export function isNudgeSeen(key: string, day: string): boolean {
  return localStorage.getItem(`cadence.nudge.${key}`) === day;
}

export async function adoptLocalData(uid: string): Promise<void> {
  setSyncUserId(uid);
  const now = Date.now();
  await db.transaction('rw', db.tasks, db.focusSessions, db.preferences, db.profile, db.syncQueue, async () => {
    const adopted: string[] = [];

    const localTasks = await db.tasks.filter((t) => t.userId === null).toArray();
    for (const t of localTasks) {
      if (seedIds.has(t.id)) continue;
      t.userId = uid;
      t.updatedAt = now;
      await db.tasks.put(t);
      enqueueOutbox('tasks', t.id, 'upsert', t);
      adopted.push(t.id);
    }

    const localSessions = await db.focusSessions.filter((s) => s.userId === null).toArray();
    for (const s of localSessions) {
      if (seedIds.has(s.id)) continue;
      s.userId = uid;
      s.updatedAt = now;
      await db.focusSessions.put(s);
      enqueueOutbox('focusSessions', s.id, 'upsert', s);
      adopted.push(s.id);
    }

    const localPrefs = await db.preferences.get('local');
    if (localPrefs) {
      const moved = { ...localPrefs, key: uid, updatedAt: now };
      await db.preferences.put(moved);
      await db.preferences.delete('local');
      enqueueOutbox('preferences', uid, 'upsert', moved);
      adopted.push('local');
    }

    const localProfile = await db.profile.get('local');
    if (localProfile) {
      const moved = { ...localProfile, key: uid, value: { ...localProfile.value, id: uid }, updatedAt: now };
      await db.profile.put(moved);
      await db.profile.delete('local');
      enqueueOutbox('profile', uid, 'upsert', moved);
      adopted.push('local');
    }

    if (adopted.length > 0) {
      const stale = await db.syncQueue.filter((e) => e.userId === null).toArray();
      const kill = stale.filter((e) => adopted.includes(e.entityId)).map((e) => e.id!);
      if (kill.length > 0) await db.syncQueue.bulkDelete(kill);
    }
  });
}
