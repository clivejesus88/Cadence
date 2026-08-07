import { format, subDays } from 'date-fns';
import { FocusSession } from '../types/session';

const today = new Date();
const iso = (d: Date) => format(d, 'yyyy-MM-dd');

// Total focus minutes per day, oldest (27 days ago) to newest (today).
// A 0 means no focus session that day, used to shape a realistic streak.
const minutesPattern = [
40, 60, 0, 75, 90, 30, 0, 50, 65, 100, 0, 45, 80, 55, 70, 0, 60, 95, 40, 75, 50, 65, 80, 90, 70, 60, 85, 95];


export const sessions: FocusSession[] = minutesPattern.flatMap((totalMinutes, idx) => {
  const daysAgo = minutesPattern.length - 1 - idx;
  const date = iso(subDays(today, daysAgo));
  if (totalMinutes === 0) return [];
  const sessionCount = Math.max(1, Math.round(totalMinutes / 25));
  const perSession = Math.round(totalMinutes / sessionCount);
  return Array.from({ length: sessionCount }, (_, i) => ({
    id: `${date}-${i}`,
    date,
    durationMinutes: perSession,
    type: 'focus' as const,
    completed: true
  }));
});