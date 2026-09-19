import { format, subDays } from 'date-fns';
import { FocusSession } from '../types/session';

export function calculateCurrentStreak(sessions: FocusSession[]): number {
  const daysWithFocus = new Set(
    sessions.filter((s) => s.type === 'focus' && s.completed).map((s) => s.date)
  );
  let streak = 0;
  let cursor = new Date();
  while (daysWithFocus.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function todayFocusMinutes(sessions: FocusSession[]): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  return sessions.
  filter((s) => s.date === today && s.type === 'focus' && s.completed).
  reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function weeklyFocusMinutes(sessions: FocusSession[]): {day: string;minutes: number;}[] {
  const result: {day: string;minutes: number;}[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const iso = format(d, 'yyyy-MM-dd');
    const minutes = sessions.
    filter((s) => s.date === iso && s.type === 'focus' && s.completed).
    reduce((sum, s) => sum + s.durationMinutes, 0);
    result.push({ day: format(d, 'EEE'), minutes });
  }
  return result;
}