import { Text, View } from 'react-native';
import { ClockIcon, FlameIcon, ListChecksIcon, TrendingUpIcon } from 'lucide-react-native';
import { useAppData } from '../contexts/AppDataContext';
import { formatMinutes } from '../utils/time';
import { distractionStats } from '../data/insightsTips';
import { StatCard } from '../components/insights/StatCard';
import { StreakHeatmap } from '../components/insights/StreakHeatmap';
import { BarChart } from '../components/ui/BarChart';
import { Screen } from '../components/ui/Screen';
import { Glass } from '../components/ui/Glass';

const appColors: Record<string, string> = {
  Instagram: '#E1306C',
  TikTok: '#25F4EE',
  YouTube: '#FF0000',
  Reddit: '#FF4500',
};

export function Insights() {
  const { weeklyData, currentStreak, totalSessionsCompleted, sessions } = useAppData();
  const weekTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const focusSessions = sessions.filter((s) => s.type === 'focus' && s.completed);
  const avgSession =
    totalSessionsCompleted > 0
      ? Math.round(focusSessions.reduce((s, se) => s + se.durationMinutes, 0) / totalSessionsCompleted)
      : 0;

  return (
    <Screen>
      <Text className="font-display text-2xl text-white">Insights</Text>
      <Text className="mt-1 text-sm text-neutral-400">Your focus patterns, at a glance.</Text>

      <View className="mt-6 gap-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard icon={ClockIcon} label="This Week" value={formatMinutes(weekTotal)} />
          </View>
          <View className="flex-1">
            <StatCard icon={FlameIcon} label="Current Streak" value={`${currentStreak} days`} />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard icon={ListChecksIcon} label="Sessions" value={`${totalSessionsCompleted}`} />
          </View>
          <View className="flex-1">
            <StatCard icon={TrendingUpIcon} label="Avg Session" value={formatMinutes(avgSession)} />
          </View>
        </View>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Daily focus time</Text>
        <Glass className="rounded-2xl p-4">
          <BarChart data={weeklyData} />
        </Glass>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Consistency</Text>
        <StreakHeatmap sessions={sessions} />
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Minimized distractions</Text>
        <Glass className="rounded-2xl">
          {distractionStats.map((s, i) => (
            <View
              key={s.name}
              className="flex-row items-center justify-between px-4 py-3"
              style={i > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' } : undefined}>
              <View className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: appColors[s.name] ?? '#fb923c' }} />
                <Text className="text-sm text-white">{s.name}</Text>
              </View>
              <Text className="text-xs text-neutral-400">{formatMinutes(s.minutesSaved)} saved</Text>
            </View>
          ))}
        </Glass>
      </View>
    </Screen>
  );
}
