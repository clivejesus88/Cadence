import { Text, View } from 'react-native';
import { Glass } from '../ui/Glass';

const bars = [30, 55, 40, 80, 65, 90, 50];

export function InsightsVisual() {
  return (
    <View className="w-full max-w-[260px]">
      <Glass variant="strong" className="rounded-3xl p-5">
        <Text className="text-xs text-neutral-400">This week</Text>
        <Text className="font-display mt-1 text-2xl text-white">6h 40m focused</Text>
        <View className="mt-5 h-24 flex-row items-end gap-2">
          {bars.map((h, i) => (
            <View
              key={i}
              className="flex-1 rounded-full bg-ember-400/80"
              style={{ height: `${h}%` }}
            />
          ))}
        </View>
      </Glass>
    </View>
  );
}
