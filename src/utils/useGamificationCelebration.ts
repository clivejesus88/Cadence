import { useEffect, useRef } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { notifyLevelUp, notifyBadgeEarned, notifyGoalMet } from './notify';

const SEEN_LEVEL_KEY = 'cadence.seenLevel';
const SEEN_BADGES_KEY = 'cadence.seenBadges';

function readSeenLevel(): number {
  const raw = localStorage.getItem(SEEN_LEVEL_KEY);
  return raw ? Number(raw) || 1 : 1;
}

function readSeenBadges(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_BADGES_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

// Watches derived gamification state and fires one-time celebration toasts.
export function useGamificationCelebration() {
  const { level, badges, goalMetToday, dailyGoalMinutes } = useAppData();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // First run for this mount: baseline without firing a storm of toasts.
      localStorage.setItem(SEEN_LEVEL_KEY, String(level.level));
      localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(badges.filter((b) => b.earned).map((b) => b.id)));
      initialized.current = true;
      return;
    }

    const seenLevel = readSeenLevel();
    if (level.level > seenLevel) {
      localStorage.setItem(SEEN_LEVEL_KEY, String(level.level));
      notifyLevelUp(level.level, level.title);
    }

    const seenBadges = readSeenBadges();
    const newlyEarned = badges.filter((b) => b.earned && !seenBadges.has(b.id));
    if (newlyEarned.length > 0) {
      newlyEarned.forEach((b) => seenBadges.add(b.id));
      localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify([...seenBadges]));
      const first = newlyEarned[0];
      notifyBadgeEarned(first.name, first.description);
    }
  }, [level, badges]);

  // Goal-met toast, once per day.
  useEffect(() => {
    if (!goalMetToday) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = `cadence.goalMet.${day}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    notifyGoalMet(dailyGoalMinutes);
  }, [goalMetToday, dailyGoalMinutes]);
}
