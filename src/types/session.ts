export type SessionType = 'focus' | 'break';

export interface FocusSession {
  id: string;
  date: string; // ISO date, yyyy-MM-dd
  durationMinutes: number;
  durationSeconds?: number;
  type: SessionType;
  completed: boolean;
  taskId?: string;
}