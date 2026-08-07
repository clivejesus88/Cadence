import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCircle2Icon } from 'lucide-react-native';
import { formatMinutes } from '../../utils/time';
import { GradientButton } from '../ui/GradientButton';

interface SessionCompleteProps {
  minutes: number;
  onBreak: () => void;
  onDone: () => void;
}

export function SessionComplete({ minutes, onBreak, onDone }: SessionCompleteProps) {
  return (
    <View className="flex-1 items-center px-5 pb-8 pt-16 text-center">
      <Animated.View entering={FadeInDown.springify().damping(16).stiffness(200)}>
        <View className="h-20 w-20 items-center justify-center rounded-full bg-ember-500/15">
          <CheckCircle2Icon size={40} color="#fb923c" />
        </View>
      </Animated.View>
      <Text className="font-display mt-6 text-2xl text-white">Nice work!</Text>
      <Text className="mt-1.5 text-sm text-neutral-400">
        You focused for {formatMinutes(minutes)}. Keep the streak going.
      </Text>

      <View className="mt-10 w-full gap-3">
        <GradientButton title="Take a 5-min break" onPress={onBreak} />
        <GradientButton
          title="Done"
          onPress={onDone}
          gradient={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.08)']}
        />
      </View>
    </View>
  );
}
