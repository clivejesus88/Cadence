import { Text, View } from 'react-native';
import { Glass } from '../ui/Glass';

interface WeeklyPreviewProps {
  data: { day: string; minutes: number }[];
}

export function WeeklyPreview({ data }: WeeklyPreviewProps) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const total = data.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <Glass className="rounded-2xl p-4">
      <Text className="text-lg font-semibold text-white">
        {Math.floor(total / 60)}
        <Text className="text-sm text-neutral-500">h</Text> {total % 60}
        <Text className="text-sm text-neutral-500">m</Text>
        <Text className="text-sm font-normal text-neutral-500"> focused this week</Text>
      </Text>
      <View className="mt-4 h-20 flex-row items-end justify-between gap-2">
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          return (
            <View key={i} className="h-full flex-1 flex-col items-center justify-end gap-2">
              <View
                className={`w-full rounded-full ${isToday ? 'bg-ember-400' : 'bg-white/10'}`}
                style={{ height: `${Math.max((d.minutes / max) * 100, 4)}%` }}
              />
              <Text className={`text-[10px] ${isToday ? 'font-semibold text-ember-400' : 'text-neutral-500'}`}>
                {d.day[0]}
              </Text>
            </View>
          );
        })}
      </View>
    </Glass>
  );
}
