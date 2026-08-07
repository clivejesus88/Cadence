import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { TimerIcon, ShieldCheckIcon, FlameIcon, SparklesIcon } from 'lucide-react-native';
import { Glass } from '../ui/Glass';

interface WelcomeModalProps {
  name: string;
  onDismiss: () => void;
}

const highlights = [
  { icon: TimerIcon, title: 'Focus in sprints', desc: 'Start a 25-minute session in one tap.' },
  { icon: ShieldCheckIcon, title: 'Block distractions', desc: 'Your noisiest apps stay quiet while you work.' },
  { icon: FlameIcon, title: 'Build your streak', desc: 'Small daily sessions compound fast.' },
];

export function WelcomeModal({ name, onDismiss }: WelcomeModalProps) {
  const firstName = name.split(' ')[0];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View entering={FadeIn} className="absolute inset-0 bg-ink-950/70" />
        <Animated.View entering={FadeInDown.springify().damping(26).stiffness(320)} className="w-full max-w-sm">
          <Glass variant="strong" className="rounded-[28px] p-6 text-center">
            <View className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-500/20">
              <SparklesIcon size={24} color="#fb923c" />
            </View>

            <Text className="font-display mt-4 text-center text-2xl text-white">
              Welcome, {firstName}
            </Text>
            <Text className="mx-auto mt-2 max-w-[260px] text-center text-sm leading-6 text-neutral-400">
              Cadence is set up and ready. Here's how to get the most out of your study time.
            </Text>

            <View className="mt-6 gap-3">
              {highlights.map(({ icon: Icon, title, desc }) => (
                <Glass key={title} variant="inset" className="flex-row items-start gap-3 rounded-2xl px-3.5 py-3">
                  <View className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                    <Icon size={16} color="#fb923c" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-white">{title}</Text>
                    <Text className="mt-0.5 text-xs text-neutral-400">{desc}</Text>
                  </View>
                </Glass>
              ))}
            </View>

            <Pressable
              onPress={onDismiss}
              className="mt-6 w-full rounded-full bg-white py-3.5">
              <Text className="text-center text-[15px] font-semibold text-ink-950">Let's focus</Text>
            </Pressable>
          </Glass>
        </Animated.View>
      </View>
    </Modal>
  );
}
