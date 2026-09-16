import { db } from './db';
import { tasks as seedTasks } from '../data/tasks';
import { sessions as seedSessions } from '../data/sessions';

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.tasks.count();
  if (existing > 0) return;
  const now = Date.now();
  await db.transaction('rw', db.tasks, db.focusSessions, async () => {
    for (const t of seedTasks) {
      await db.tasks.put({ ...t, userId: null, createdAt: now, updatedAt: now, deleted: false });
    }
    for (const s of seedSessions) {
      await db.focusSessions.put({ ...s, userId: null, createdAt: now, updatedAt: now, deleted: false });
    }
  });
}