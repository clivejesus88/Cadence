
import { useEffect, useState } from 'react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FlameIcon, ChevronRightIcon, CrownIcon, LoaderCircleIcon, PlayIcon } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatMinutes, getGreeting } from '../utils/time';
import { focusTips } from '../data/insightsTips';
import { notifySessionReminder, notifyDailySummary, notifyTaskReminders } from '../utils/notify';
import { markNudgeSeen, isNudgeSeen } from '../db/repo';
import { WeeklyPreview } from '../components/home/WeeklyPreview';
import { InsightTipCarousel } from '../components/home/InsightTipCarousel';
import { TaskPreviewList } from '../components/home/TaskPreviewList';
import { Avatar } from '../components/profile/Avatar';
import { getWeeklyLeaderboard, LeaderboardEntry } from '../utils/leaderboard';

export function Home() {
  const navigate = useNavigate();
  const { user, isGuest, isConfigured } = useAuth();
  const {
    currentStreak,
    todayMinutes,
    totalSessionsCompleted,
    tasks,
    weeklyData,
    level,
    dailyGoalMinutes
  } = useAppData();
  const { profile, preferences } = useSettings();
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    if (!user || isGuest || !isConfigured) {
      setLeaderboardEntries([]);
      return;
    }

    let active = true;
    setLeaderboardLoading(true);
    getWeeklyLeaderboard()
      .then((entries) => {
        if (active) setLeaderboardEntries(entries.slice(0, 3));
      })
      .finally(() => {
        if (active) setLeaderboardLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, isGuest, isConfigured]);
  const todaysTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const firstName = profile.name.trim().split(' ')[0] || 'there';

  const outstandingTasks = tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const overdueCount = outstandingTasks.filter((t) => {
    const d = parseISO(t.dueDate);
    return isPast(d) && !isToday(d);
  }).length;
  const todayDueCount = outstandingTasks.filter((t) => isToday(parseISO(t.dueDate))).length;
  const firstReminderTask = outstandingTasks.find((t) => {
    const d = parseISO(t.dueDate);
    return isPast(d) || isToday(d);
  })?.title ?? '';

  useEffect(() => {
    const day = format(new Date(), 'yyyy-MM-dd');
    if (preferences.taskReminders && (overdueCount > 0 || todayDueCount > 0) && !isNudgeSeen('taskReminder', day)) {
      markNudgeSeen('taskReminder', day);
      notifyTaskReminders(overdueCount, todayDueCount, firstReminderTask);
    }
    if (preferences.sessionReminders && todayMinutes === 0 && !isNudgeSeen('reminder', day)) {
      markNudgeSeen('reminder', day);
      notifySessionReminder();
    }
    if (preferences.dailySummary && new Date().getHours() >= 18 && !isNudgeSeen('summary', day)) {
      if (totalSessionsCompleted > 0 || todayMinutes > 0) {
        markNudgeSeen('summary', day);
        notifyDailySummary(todayMinutes, totalSessionsCompleted);
      }
    }
  }, [preferences.taskReminders, preferences.sessionReminders, preferences.dailySummary, todayMinutes, totalSessionsCompleted, overdueCount, todayDueCount, firstReminderTask]);

  return (
    <div className="px-5 pt-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:px-8 lg:pt-8">
      <header className="flex items-center justify-between gap-4 lg:col-span-2">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate('/app/profile')}
            aria-label="Open profile and settings"
            className="flex h-[4.5rem] w-[4.25rem] flex-shrink-0 items-center justify-center rounded-2xl transition-transform active:scale-95">
            <Avatar value={profile.avatarUrl} className="h-16 w-16" alt={profile.name} />
          </button>
          <div className="min-w-0 py-1">
            <p className="text-xs font-medium text-neutral-500">{getGreeting()}</p>
            <h1 className="font-script truncate text-[2.6rem] leading-[0.95] text-white">{firstName}</h1>
            <p className="mt-1 truncate text-[11px] tracking-wide text-neutral-500">
              Level {level.level}<span className="px-1.5 text-neutral-700">·</span>{level.title}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center border-l border-white/[0.08] pl-3.5">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <FlameIcon className="h-4 w-4 text-ember-400" />
              <span className="font-numeric text-xl font-semibold leading-none tabular-nums text-white">{currentStreak}</span>
            </div>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-500">day streak</p>
          </div>
        </div>
      </header>

      <button
        onClick={() => navigate('/app/focus')}
        aria-label={`Start a ${preferences.defaultDuration}-minute focus session`}
        className="group relative mt-6 w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(20,24,27,0.96),rgba(15,17,20,0.96))] p-5 text-left shadow-[0_18px_45px_-30px_rgba(0,0,0,0.9)] transition-all hover:border-white/[0.14] hover:bg-[linear-gradient(145deg,rgba(24,28,32,0.98),rgba(15,17,20,0.96))] active:scale-[0.99] lg:col-span-2 lg:mt-0 lg:p-7">
        <div className="relative flex items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Focus session</p>
            <p className="mt-2 font-display text-[1.7rem] leading-[1.1] text-white">Deep work, reset.</p>
            <p className="mt-1.5 text-sm text-neutral-400">
              {formatMinutes(preferences.defaultDuration)} · built for one clear task
            </p>
          </div>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white shadow-[0_10px_25px_-12px_rgba(255,255,255,0.35)] transition-transform group-hover:scale-105">
            <PlayIcon className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </div>

        <div className="relative mt-6 flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            <span className="inline-flex h-2 w-2 rounded-full border border-white/20 bg-white/10" />
            Goal
          </div>
          <div
            role="progressbar"
            aria-label="Daily focus goal progress"
            aria-valuemin={0}
            aria-valuemax={dailyGoalMinutes}
            aria-valuenow={Math.min(todayMinutes, dailyGoalMinutes)}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="block h-full rounded-full bg-white/80 transition-[width]"
              style={{ width: `${Math.min(100, (todayMinutes / Math.max(1, dailyGoalMinutes)) * 100)}%` }}
            />
          </div>
          <p className="flex-shrink-0 text-[10px] font-medium tabular-nums text-neutral-400">
            {formatMinutes(todayMinutes)} <span className="text-neutral-700">/</span> {formatMinutes(dailyGoalMinutes)}
          </p>
        </div>
      </button>

      <section className="mt-6 lg:mt-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold">This week</p>
          <button
            onClick={() => navigate('/app/insights')}
            className="hit-slop text-xs text-neutral-500 flex items-center gap-0.5 hover:text-neutral-300 transition-colors active:text-white">
            
            Details <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <WeeklyPreview data={weeklyData} />
      </section>

      <section className="mt-6 lg:mt-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold">Up next</p>
          <button
            onClick={() => navigate('/app/planner')}
            className="hit-slop text-xs text-neutral-500 flex items-center gap-0.5 hover:text-neutral-300 transition-colors active:text-white">
            
            All tasks <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <TaskPreviewList tasks={todaysTasks} />
      </section>

      <section className="mt-6 lg:col-span-2 lg:mt-0">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-white font-semibold">Top ranks</p>
          <button
            onClick={() => navigate('/app/insights')}
            className="hit-slop text-xs text-neutral-500 flex items-center gap-0.5 hover:text-neutral-300 transition-colors active:text-white">
            View insights <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="glass rounded-2xl p-4">
          {leaderboardLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-400">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : !user || isGuest || !isConfigured || leaderboardEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">Sign in and opt in to see this week’s top focus ranks.</p>
          ) : (
            <div className="space-y-2">
              {leaderboardEntries.map((entry) => (
                <div key={`${entry.rank}-${entry.alias}`} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${entry.rank <= 3 ? 'bg-ember-500/15 text-ember-300' : 'bg-white/5 text-neutral-400'}`}>
                      {entry.rank <= 3 ? <CrownIcon className="h-3.5 w-3.5" /> : entry.rank}
                    </span>
                    <span className="truncate text-sm text-white">{entry.alias}{entry.isCurrentUser ? ' (you)' : ''}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-200">{entry.focusMinutes} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <InsightTipCarousel tips={focusTips} />
    </div>);

}