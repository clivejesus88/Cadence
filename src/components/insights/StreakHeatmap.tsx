import { useState } from 'react';
import { Text, View } from 'react-native';
import { format, subDays } from 'date-fns';
import { FocusSession } from '../../types/session';
import { Glass } from '../ui/Glass';

interface StreakHeatmapProps {
  sessions: FocusSession[];
}

const GAP = 6;

export function StreakHeatmap({ sessions }: StreakHeatmapProps) {
  const [width, setWidth] = useState(0);
  const days = Array.from({ length: 28 }, (_, i) => subDays(new Date(), 27 - i));
  const minutesByDate = new Map<string, number>();
  sessions
    .filter((s) => s.type === 'focus' && s.completed)
    .forEach((s) => {
      minutesByDate.set(s.date, (minutesByDate.get(s.date) ?? 0) + s.durationMinutes);
    });
  const max = Math.max(...Array.from(minutesByDate.values()), 1);
  const cell = width > 0 ? (width - GAP * 6) / 7 : 0;

  return (
    <Glass className="rounded-2xl p-4">
      <View className="flex-row flex-wrap" style={{ gap: GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 &&
          days.map((d, i) => {
            const iso = format(d, 'yyyy-MM-dd');
            const minutes = minutesByDate.get(iso) ?? 0;
            const intensity = minutes === 0 ? 0 : Math.min(1, minutes / max);
            return (
              <View
                key={i}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 6,
                  backgroundColor:
                    intensity === 0 ? '#20252c' : `rgba(251,146,60,${0.25 + intensity * 0.75})`,
                }}
              />
            );
          })}
      </View>
      <View className="mt-3 flex-row items-center justify-end gap-1.5">
        <Text className="text-[10px] text-neutral-500">Less</Text>
        <View className="h-2.5 w-2.5 rounded-sm bg-ink-700" />
        <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'rgba(251,146,60,0.4)' }} />
        <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'rgba(251,146,60,1)' }} />
        <Text className="text-[10px] text-neutral-500">More</Text>
      </View>
    </Glass>
  );
}
