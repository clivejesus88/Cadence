import { isSupabaseConfigured } from '../lib/supabase';
import { db } from './db';
import { tasks as seedTasks } from '../data/tasks';
import { sessions as seedSessions } from '../data/sessions';

export async function seedIfEmpty(): Promise<void> {
  if (isSupabaseConfigured) return;
  const now = Date.now();
  await db.transaction('rw', db.tasks, db.focusSessions, async () => {
    const hasTasks = (await db.tasks.count()) > 0;
    if (!hasTasks) {
      for (const t of seedTasks) {
        await db.tasks.put({ ...t, userId: null, createdAt: now, updatedAt: now, deleted: false });
      }
    }
    const hasSessions = (await db.focusSessions.count()) > 0;
    if (!hasSessions) {
      for (const s of seedSessions) {
        await db.focusSessions.put({ ...s, userId: null, createdAt: now, updatedAt: now, deleted: false });
      }
    }
  });
}