
import { useEffect } from 'react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FlameIcon, ArrowRightIcon, ChevronRightIcon, TimerIcon, LightbulbIcon } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatMinutes, getGreeting } from '../utils/time';
import { focusTips } from '../data/insightsTips';
import { notifySessionReminder, notifyDailySummary, notifyTaskReminders } from '../utils/notify';
import { markNudgeSeen, isNudgeSeen } from '../db/repo';
import { WeeklyPreview } from '../components/home/WeeklyPreview';
import { TaskPreviewList } from '../components/home/TaskPreviewList';

export function Home() {
  const navigate = useNavigate();
  const { currentStreak, todayMinutes, totalSessionsCompleted, tasks, weeklyData } = useAppData();
  const { profile, preferences } = useSettings();
  const todaysTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const firstName = profile.name.split(' ')[0];

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
    <div className="px-5 pt-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/profile')}
            aria-label="Open profile and settings"
            className="rounded-full ring-2 ring-white/15 transition-transform active:scale-95">
            
            <img src={profile.avatarUrl} alt={profile.name} className="h-11 w-11 rounded-full object-cover" />
          </button>
          <div>
            <p className="text-neutral-400 text-sm">{getGreeting()}</p>
            <p className="font-display text-2xl text-white">{firstName}</p>
          </div>
        </div>
        <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5">
          <FlameIcon className="w-4 h-4 text-ember-400" />
          <span className="text-sm font-semibold text-white">{currentStreak}</span>
        </div>
      </header>

      <button
        onClick={() => navigate('/app/focus')}
        className="glass-strong mt-6 w-full text-left rounded-3xl p-5 relative overflow-hidden active:scale-[0.99] transition-transform">
        
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Quick Start</p>
            <p className="font-display text-xl text-white mt-1">Start a focus session</p>
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ember-500/20">
            <TimerIcon className="w-5 h-5 text-ember-400" />
          </div>
        </div>
        <p className="text-neutral-400 text-sm mt-3">
          {formatMinutes(todayMinutes)} focused today · {totalSessionsCompleted} sessions total
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white text-ink-950 font-semibold text-sm px-4 py-2">
          Begin now <ArrowRightIcon className="w-4 h-4" />
        </div>
      </button>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold">This week</p>
          <button
            onClick={() => navigate('/app/insights')}
            className="text-xs text-neutral-500 flex items-center gap-0.5 hover:text-neutral-300 transition-colors">
            
            Details <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <WeeklyPreview data={weeklyData} />
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold">Up next</p>
          <button
            onClick={() => navigate('/app/planner')}
            className="text-xs text-neutral-500 flex items-center gap-0.5 hover:text-neutral-300 transition-colors">
            
            All tasks <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <TaskPreviewList tasks={todaysTasks} />
      </section>

      <section className="glass mt-6 mb-8 flex items-start gap-3 rounded-2xl p-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
          <LightbulbIcon className="w-4 h-4 text-neutral-300" />
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Insight Tip</p>
          <p className="text-sm text-neutral-300">{focusTips[0]}</p>
        </div>
      </section>
    </div>);

}