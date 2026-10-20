import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  SparklesIcon,
  FlameIcon,
  ClockIcon,
  TargetIcon,
  TrophyIcon,
  CalendarCheckIcon,
  ZapIcon,
  CrownIcon
} from 'lucide-react';
import { FocusSession } from '../types/session';

const FOCUS_BONUS_PER_SESSION = 5;

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  xpIntoLevel: number;
  xpForLevel: number;
  progress: number; // 0..1
}

export interface BadgeStatus {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  progress: number; // 0..1
  progressLabel: string;
}

export interface GamificationStats {
  xp: number;
  level: LevelInfo;
  totalFocusMinutes: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  badges: BadgeStatus[];
  earnedBadgeCount: number;
}

const LEVEL_TITLES = ['Novice', 'Focused', 'Consistent', 'Deep Worker', 'Flow Master', 'Flow Sage', 'Cadence Legend'];

// Cumulative XP needed to *reach* a level. Gentle curve so early levels come
// quickly (dopamine) without the later ones feeling unreachable.
function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let n = 1; n < level; n++) total += Math.round(100 * Math.pow(n, 1.25));
  return total;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp && level < 99) level += 1;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpIntoLevel = xp - base;
  const xpForLevelSpan = Math.max(1, next - base);
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  return {
    level,
    title,
    xp,
    xpIntoLevel,
    xpForLevel: xpForLevelSpan,
    progress: Math.min(1, xpIntoLevel / xpForLevelSpan)
  };
}

export function xpFromSessions(sessions: FocusSession[]): number {
  const focused = sessions.filter((s) => s.type === 'focus' && s.completed);
  const minutes = focused.reduce((sum, s) => sum + s.durationMinutes, 0);
  return minutes + focused.length * FOCUS_BONUS_PER_SESSION;
}

function longestStreak(sessions: FocusSession[]): number {
  const days = Array.from(
    new Set(sessions.filter((s) => s.type === 'focus' && s.completed).map((s) => s.date))
  ).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of days) {
    const d = new Date(`${day}T00:00:00`);
    if (prev && (d.getTime() - prev.getTime()) / 86400000 === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function todayGoalMinutes(sessions: FocusSession[], date = new Date()): number {
  const key = format(date, 'yyyy-MM-dd');
  return sessions
    .filter((s) => s.date === key && s.type === 'focus' && s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function goalMet(sessions: FocusSession[], goalMinutes: number, date = new Date()): boolean {
  return goalMinutes > 0 && todayGoalMinutes(sessions, date) >= goalMinutes;
}

// How many of the last 7 days hit the daily goal.
export function weeklyGoalDays(sessions: FocusSession[], goalMinutes: number): number {
  let count = 0;
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    if (goalMet(sessions, goalMinutes, d)) count += 1;
  }
  return count;
}

export function evaluateBadges(
  sessions: FocusSession[],
  _currentStreak: number,
  goalMinutes: number
): BadgeStatus[] {
  const focused = sessions.filter((s) => s.type === 'focus' && s.completed);
  const totalSessions = focused.length;
  const totalMinutes = focused.reduce((sum, s) => sum + s.durationMinutes, 0);
  const best = longestStreak(sessions);
  const last7GoalDays = weeklyGoalDays(sessions, goalMinutes);

  const defs: {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    value: number;
    target: number;
    label: (v: number) => string;
  }[] = [
    { id: 'first-session', name: 'First Step', description: 'Complete your first focus session', icon: SparklesIcon, value: totalSessions, target: 1, label: (v) => `${Math.min(v, 1)}/1` },
    { id: 'streak-3', name: 'Warming Up', description: 'Focus 3 days in a row', icon: FlameIcon, value: best, target: 3, label: (v) => `${Math.min(v, 3)}/3` },
    { id: 'streak-7', name: 'Week Warrior', description: 'Focus 7 days in a row', icon: FlameIcon, value: best, target: 7, label: (v) => `${Math.min(v, 7)}/7` },
    { id: 'streak-30', name: 'Unbreakable', description: 'Focus 30 days in a row', icon: CrownIcon, value: best, target: 30, label: (v) => `${Math.min(v, 30)}/30` },
    { id: 'ten-hours', name: 'Ten Hours', description: 'Accumulate 10 hours of focus', icon: ClockIcon, value: totalMinutes, target: 600, label: (v) => `${Math.floor(v / 60)}/10h` },
    { id: 'fifty-hours', name: 'Deep Diver', description: 'Accumulate 50 hours of focus', icon: ClockIcon, value: totalMinutes, target: 3000, label: (v) => `${Math.floor(v / 60)}/50h` },
    { id: 'sessions-50', name: 'Half Century', description: 'Complete 50 focus sessions', icon: ZapIcon, value: totalSessions, target: 50, label: (v) => `${Math.min(v, 50)}/50` },
    { id: 'goal-crusher', name: 'Goal Crusher', description: 'Hit your daily goal 7 days this week', icon: TargetIcon, value: last7GoalDays, target: 7, label: (v) => `${Math.min(v, 7)}/7` },
    { id: 'marathon', name: 'Marathon', description: 'Complete a single 90-minute session', icon: TrophyIcon, value: focused.some((s) => s.durationMinutes >= 90) ? 1 : 0, target: 1, label: (v) => `${Math.min(v, 1)}/1` },
    { id: 'goal-today', name: 'On Target', description: 'Reach your daily goal today', icon: CalendarCheckIcon, value: goalMet(sessions, goalMinutes) ? 1 : 0, target: 1, label: (v) => `${Math.min(v, 1)}/1` }
  ];

  return defs.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon,
    earned: d.value >= d.target,
    progress: Math.min(1, d.value / d.target),
    progressLabel: d.label(d.value)
  }));
}

export function buildStats(
  sessions: FocusSession[],
  currentStreak: number,
  goalMinutes: number
): GamificationStats {
  const xp = xpFromSessions(sessions);
  const focused = sessions.filter((s) => s.type === 'focus' && s.completed);
  const badges = evaluateBadges(sessions, currentStreak, goalMinutes);
  return {
    xp,
    level: levelFromXp(xp),
    totalFocusMinutes: focused.reduce((sum, s) => sum + s.durationMinutes, 0),
    totalSessions: focused.length,
    currentStreak,
    longestStreak: longestStreak(sessions),
    badges,
    earnedBadgeCount: badges.filter((b) => b.earned).length
  };
}
