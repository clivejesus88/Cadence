import { Text, View } from 'react-native';
import { CircularTimer } from '../CircularTimer';

export function TimerVisual() {
  return (
    <View className="items-center justify-center">
      <CircularTimer progress={0.62} size={220} strokeWidth={12}>
        <View className="text-center">
          <Text className="font-display text-4xl text-white">18:24</Text>
          <Text className="mt-1 text-xs uppercase tracking-wide text-neutral-400">
            Focus Session
          </Text>
        </View>
      </CircularTimer>
    </View>
  );
}
