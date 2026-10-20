import { db } from './db';

// Legacy builds seeded demo tasks (ids t1..t7) and a month of fake sessions
// (ids like "2026-01-01-0") for offline/guest users. We no longer seed demo
// data, so clean up any rows those builds wrote into existing browsers.
const SEED_TASK_IDS = new Set(['t1', 't2', 't3', 't4', 't5', 't6', 't7']);
const SEED_SESSION_ID = /^\d{4}-\d{2}-\d{2}-\d+$/;

export async function seedIfEmpty(): Promise<void> {
  await db.transaction('rw', db.tasks, db.focusSessions, async () => {
    const localTasks = await db.tasks.filter((t) => t.userId === null).toArray();
    const staleTaskIds = localTasks.filter((t) => SEED_TASK_IDS.has(t.id)).map((t) => t.id);
    if (staleTaskIds.length > 0) await db.tasks.bulkDelete(staleTaskIds);

    const localSessions = await db.focusSessions.filter((s) => s.userId === null).toArray();
    const staleSessionIds = localSessions.filter((s) => SEED_SESSION_ID.test(s.id)).map((s) => s.id);
    if (staleSessionIds.length > 0) await db.focusSessions.bulkDelete(staleSessionIds);
  });
}
