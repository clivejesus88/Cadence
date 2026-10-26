import { useMemo, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { BarChart3Icon, ClockIcon, FlameIcon, ListChecksIcon, TrendingUpIcon } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { formatMinutes } from '../utils/time';
import { rangeFocusMinutes, monthlyFocusMinutes, longestFocusStreak } from '../utils/streak';
import { StatCard } from '../components/insights/StatCard';
import { StreakHeatmap } from '../components/insights/StreakHeatmap';

const rangeOptions = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 }];

export function Insights() {
  const { weeklyData, currentStreak, totalSessionsCompleted, sessions, tasks } = useAppData();
  const [rangeDays, setRangeDays] = useState(7);

  const weekTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const focusSessions = sessions.filter((s) => s.type === 'focus' && s.completed);
  const chartData = useMemo(() => rangeFocusMinutes(sessions, rangeDays), [sessions, rangeDays]);
  const rangeTotal = useMemo(() => chartData.reduce((sum, d) => sum + d.minutes, 0), [chartData]);
  const monthlyData = useMemo(() => monthlyFocusMinutes(sessions), [sessions]);
  const totalFocusMinutes = focusSessions.reduce((s, se) => s + se.durationMinutes, 0);
  const longestStreak = useMemo(() => longestFocusStreak(sessions), [sessions]);
  const avgSession =
  totalSessionsCompleted > 0 ?
  Math.round(focusSessions.reduce((s, se) => s + se.durationMinutes, 0) / totalSessionsCompleted) :
  0;

  const subjectBreakdown = useMemo(() => {
    const subjectById = new Map(tasks.map((t) => [t.id, t.subject]));
    const totals = new Map<string, number>();
    for (const s of focusSessions) {
      const subject = s.taskId ? (subjectById.get(s.taskId) ?? 'General') : 'General';
      totals.set(subject, (totals.get(subject) ?? 0) + s.durationMinutes);
    }
    const total = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    return Array.from(totals.entries())
      .map(([subject, minutes]) => ({ subject, minutes, pct: total > 0 ? Math.round((minutes / total) * 100) : 0 }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [tasks, focusSessions]);

  return (
    <div className="px-5 pt-8 pb-8 lg:grid lg:grid-cols-2 lg:gap-6 lg:px-8 lg:pt-10">
      <header className="lg:col-span-2">
        <h1 className="font-display text-2xl text-white">Insights</h1>
        <p className="text-neutral-400 text-sm mt-1">Your focus patterns, at a glance.</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:col-span-2 lg:mt-0 lg:grid-cols-4">
        <StatCard icon={ClockIcon} label="This Week" value={formatMinutes(weekTotal)} />
        <StatCard icon={FlameIcon} label="Current Streak" value={`${currentStreak} days`} />
        <StatCard icon={ListChecksIcon} label="Sessions" value={`${totalSessionsCompleted}`} />
        <StatCard icon={TrendingUpIcon} label="Avg Session" value={formatMinutes(avgSession)} />
      </div>

      <section className="mt-6 lg:mt-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-white font-semibold text-sm">Daily focus time</p>
            <p className="mt-0.5 text-xs text-neutral-500">{formatMinutes(rangeTotal)} in the last {rangeDays} days</p>
          </div>
          <div className="glass-inset flex flex-shrink-0 rounded-full p-0.5">
            {rangeOptions.map((o) =>
            <button
              key={o.days}
              onClick={() => setRangeDays(o.days)}
              aria-pressed={rangeDays === o.days}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
              rangeDays === o.days ? 'bg-ember-500 text-ink-950' : 'text-neutral-400'}`
              }>
              
                {o.label}
              </button>
            )}
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          {focusSessions.length === 0 ?
          <div className="flex h-44 flex-col items-center justify-center text-center">
              <BarChart3Icon className="h-6 w-6 text-neutral-600" />
              <p className="mt-2 text-sm text-neutral-500">Your daily focus will chart here after your first session.</p>
            </div> :
          <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" interval="preserveStartEnd" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(251,146,60,0.08)' }}
                    contentStyle={{ background: '#181c22', border: '1px solid #2a3038', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#fb923c' }}
                    formatter={(v: number) => [`${v} min`, 'Focused']} />
                  <Bar dataKey="minutes" radius={[8, 8, 8, 8]} fill="#fb923c" maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>
      </section>

      <section className="mt-6 lg:mt-0">
        <p className="text-white font-semibold text-sm mb-3">Consistency</p>
        <StreakHeatmap sessions={sessions} />
      </section>

      <section className="mt-6 lg:mt-0">
        <p className="text-white font-semibold text-sm mb-3">Monthly trend</p>
        <div className="glass rounded-2xl p-4">
          {focusSessions.length === 0 ?
          <div className="flex h-40 flex-col items-center justify-center text-center">
              <TrendingUpIcon className="h-6 w-6 text-neutral-600" />
              <p className="mt-2 text-sm text-neutral-500">Monthly trends appear once you have sessions.</p>
            </div> :
          <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={monthlyData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                    contentStyle={{ background: '#181c22', border: '1px solid #2a3038', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#a78bfa' }}
                    formatter={(v: number) => [`${formatMinutes(v)}`, 'Focused']} />
                  <Bar dataKey="minutes" radius={[8, 8, 8, 8]} fill="#8b5cf6" maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>
      </section>

      <section className="mt-6 lg:mt-0">
        <p className="text-white font-semibold text-sm mb-3">By subject</p>
        <div className="glass rounded-2xl p-4">
          {subjectBreakdown.length === 0 &&
          <p className="text-sm text-neutral-500 py-2">Log a few sessions and your subject breakdown will appear here.</p>
          }
          <div className="space-y-3">
            {subjectBreakdown.map((s) =>
            <div key={s.subject}>
                <div className="flex items-center justify-between mb-1">
                  <p className="min-w-0 truncate text-sm text-white">{s.subject}</p>
                  <p className="text-xs text-neutral-500">{formatMinutes(s.minutes)} · {s.pct}%</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-ember-500" style={{ width: `${Math.max(4, s.pct)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 lg:mt-0 lg:col-span-2">
        <p className="text-white font-semibold text-sm mb-3">Focus summary</p>
        <div className="glass rounded-2xl divide-y divide-white/5">
          {totalSessionsCompleted === 0 ?
          <p className="px-4 py-3 text-sm text-neutral-500">Complete a focus session and your summary will build up here.</p> :

          <>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="min-w-0 truncate text-sm text-white">Total focus time</p>
                <p className="ml-2 flex-shrink-0 whitespace-nowrap text-xs text-neutral-400">{formatMinutes(totalFocusMinutes)}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="min-w-0 truncate text-sm text-white">Total sessions</p>
                <p className="ml-2 flex-shrink-0 whitespace-nowrap text-xs text-neutral-400">{totalSessionsCompleted}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="min-w-0 truncate text-sm text-white">Longest streak</p>
                <p className="ml-2 flex-shrink-0 whitespace-nowrap text-xs text-neutral-400">{longestStreak} days</p>
              </div>
            </>
          }
        </div>
      </section>
    </div>);

}