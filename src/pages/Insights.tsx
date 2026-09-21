import { useMemo, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { ClockIcon, FlameIcon, ListChecksIcon, LockIcon, SparklesIcon, TrendingUpIcon } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatMinutes } from '../utils/time';
import { rangeFocusMinutes, monthlyFocusMinutes } from '../utils/streak';
import { distractionStats } from '../data/insightsTips';
import { isPro, FeatureKey } from '../utils/premium';
import { StatCard } from '../components/insights/StatCard';
import { StreakHeatmap } from '../components/insights/StreakHeatmap';
import { UpgradeSheet } from '../components/premium/UpgradeSheet';

const rangeOptions = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 }];

export function Insights() {
  const { weeklyData, currentStreak, totalSessionsCompleted, sessions, tasks } = useAppData();
  const { profile } = useSettings();
  const pro = isPro(profile);
  const [rangeDays, setRangeDays] = useState(7);
  const [upgrade, setUpgrade] = useState<FeatureKey | null>(null);

  const weekTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const focusSessions = sessions.filter((s) => s.type === 'focus' && s.completed);
  const chartData = useMemo(
    () => (pro ? rangeFocusMinutes(sessions, rangeDays) : weeklyData),
    [pro, sessions, rangeDays, weeklyData]
  );
  const monthlyData = useMemo(() => monthlyFocusMinutes(sessions), [sessions]);
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
    <div className="px-5 pt-8 pb-8">
      <h1 className="font-display text-2xl text-white">Insights</h1>
      <p className="text-neutral-400 text-sm mt-1">Your focus patterns, at a glance.</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <StatCard icon={ClockIcon} label="This Week" value={formatMinutes(weekTotal)} />
        <StatCard icon={FlameIcon} label="Current Streak" value={`${currentStreak} days`} />
        <StatCard icon={ListChecksIcon} label="Sessions" value={`${totalSessionsCompleted}`} />
        <StatCard icon={TrendingUpIcon} label="Avg Session" value={formatMinutes(avgSession)} />
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-sm">Daily focus time</p>
          {pro &&
          <div className="glass-inset flex rounded-full p-0.5">
              {rangeOptions.map((o) =>
              <button
                key={o.days}
                onClick={() => setRangeDays(o.days)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                rangeDays === o.days ? 'bg-ember-500 text-ink-950' : 'text-neutral-400'}`
                }>
                
                  {o.label}
                </button>
              )}
            </div>
          }
        </div>
        <div className="glass rounded-2xl p-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
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
      </section>

      <section className="mt-6">
        <p className="text-white font-semibold text-sm mb-3">Consistency</p>
        <StreakHeatmap sessions={sessions} />
      </section>

      {pro &&
      <>
        <section className="mt-6">
          <p className="text-white font-semibold text-sm mb-3">Monthly trend</p>
          <div className="glass rounded-2xl p-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
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
        </section>

        <section className="mt-6">
          <p className="text-white font-semibold text-sm mb-3">By subject</p>
          <div className="glass rounded-2xl p-4">
            {subjectBreakdown.length === 0 &&
            <p className="text-sm text-neutral-500 py-2">Log a few sessions and your subject breakdown will appear here.</p>
            }
            <div className="space-y-3">
              {subjectBreakdown.map((s) =>
              <div key={s.subject}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-white">{s.subject}</p>
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
      </>
      }

      {!pro &&
      <section className="glass-strong relative mt-6 overflow-hidden rounded-2xl p-5">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-ember-500/20 blur-[60px]" />
          </div>
          <div className="relative flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ember-500 to-orange-600">
              <LockIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Deeper insights</p>
              <p className="mt-0.5 text-xs text-neutral-400">Monthly trends and subject breakdowns with Pro.</p>
              <button
                onClick={() => setUpgrade('deepInsights')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ember-500/15 px-3.5 py-2 text-xs font-semibold text-ember-400 transition-colors hover:bg-ember-500/25">
                <SparklesIcon className="h-3.5 w-3.5" />
                Unlock monthly patterns
              </button>
            </div>
          </div>
        </section>
      }

      <section className="mt-6">
        <p className="text-white font-semibold text-sm mb-3">Distractions blocked</p>
        <div className="glass rounded-2xl divide-y divide-white/5">
          {distractionStats.map((d) =>
          <div key={d.name} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-white">{d.name}</p>
              <p className="text-xs text-neutral-500">{d.minutesSaved} min saved</p>
            </div>
          )}
        </div>
      </section>

      <UpgradeSheet feature={upgrade} onClose={() => setUpgrade(null)} />
    </div>);

}