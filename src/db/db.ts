import Dexie, { Table } from 'dexie';
import { Task } from '../types/task';
import { FocusSession } from '../types/session';
import { UserProfile, Preferences } from '../types/user';

export interface TaskRow extends Task {
  userId: string | null;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface SessionRow extends FocusSession {
  userId: string | null;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface PreferencesRow {
  key: string;
  value: Preferences;
  updatedAt: number;
  deleted: boolean;
}

export interface ProfileRow {
  key: string;
  value: UserProfile;
  updatedAt: number;
  deleted: boolean;
}

export type SyncTableName = 'tasks' | 'focusSessions' | 'preferences' | 'profile';
export type SyncOp = 'upsert' | 'delete';

export interface SyncQueueRow {
  id?: number;
  table: SyncTableName;
  entityId: string;
  op: SyncOp;
  payload?: unknown;
  userId: string | null;
  updatedAt: number;
}

export interface SyncStateRow {
  key: string;
  lastWatermark: number;
}

class CadenceDB extends Dexie {
  tasks!: Table<TaskRow, string>;
  focusSessions!: Table<SessionRow, string>;
  preferences!: Table<PreferencesRow, string>;
  profile!: Table<ProfileRow, string>;
  syncQueue!: Table<SyncQueueRow, number>;
  syncState!: Table<SyncStateRow, string>;

  constructor() {
    super('cadence-db');
    this.version(1).stores({
      tasks: 'id, userId, updatedAt, deleted',
      focusSessions: 'id, userId, updatedAt, deleted, date',
      preferences: 'key, updatedAt, deleted',
      profile: 'key, updatedAt, deleted',
      syncQueue: '++id, userId, updatedAt, table',
      syncState: 'key'
    });
  }
}

export const db = new CadenceDB();