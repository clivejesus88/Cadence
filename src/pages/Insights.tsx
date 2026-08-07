import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { ClockIcon, FlameIcon, ListChecksIcon, TrendingUpIcon } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { formatMinutes } from '../utils/time';
import { distractionStats } from '../data/insightsTips';
import { StatCard } from '../components/insights/StatCard';
import { StreakHeatmap } from '../components/insights/StreakHeatmap';

export function Insights() {
  const { weeklyData, currentStreak, totalSessionsCompleted, sessions } = useAppData();
  const weekTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const focusSessions = sessions.filter((s) => s.type === 'focus' && s.completed);
  const avgSession =
  totalSessionsCompleted > 0 ?
  Math.round(focusSessions.reduce((s, se) => s + se.durationMinutes, 0) / totalSessionsCompleted) :
  0;

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
        <p className="text-white font-semibold text-sm mb-3">Daily focus time</p>
        <div className="glass rounded-2xl p-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
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
    </div>);

}