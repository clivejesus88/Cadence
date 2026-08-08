import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { TimerIcon } from 'lucide-react-native';
import { OnboardingDots } from '../components/onboarding/OnboardingDots';
import { TimerVisual } from '../components/onboarding/TimerVisual';
import { BlockVisual } from '../components/onboarding/BlockVisual';
import { InsightsVisual } from '../components/onboarding/InsightsVisual';
import { PlannerVisual } from '../components/onboarding/PlannerVisual';
import { Paywall } from '../components/onboarding/Paywall';
import { GradientButton } from '../components/ui/GradientButton';
import { heroImage } from '../constants/theme';

const features = [
  {
    key: 'timer',
    Visual: TimerVisual,
    title: 'Focus in Sprints',
    subtitle: 'Structured Pomodoro sessions keep you sharp and help you avoid burnout.',
  },
  {
    key: 'block',
    Visual: BlockVisual,
    title: 'Block Distractions',
    subtitle: 'Silence social media and notifications the moment a session starts.',
  },
  {
    key: 'insights',
    Visual: InsightsVisual,
    title: 'See Your Patterns',
    subtitle: 'Understand when and how you focus best, backed by real data.',
  },
  {
    key: 'planner',
    Visual: PlannerVisual,
    title: 'Plan Your Study Time',
    subtitle: 'Turn assignments into sessions and never lose track of deadlines.',
  },
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const goHome = () => router.replace('/home');
  const next = () => setStep((s) => Math.min(s + 1, 5));

  if (step === 0) {
    return (
      <View className="relative flex-1 justify-end bg-ink-950">
        <Image source={heroImage} className="absolute inset-0 h-full w-full" />
        <LinearGradient
          colors={['rgba(10,13,16,0.6)', 'rgba(10,13,16,0.3)', '#0a0d10']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View className="relative z-10 items-center px-10 pb-16 text-center">
          <View className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-500/20">
            <TimerIcon size={28} color="#fb923c" />
          </View>
          <Text className="font-display mt-5 text-4xl text-white">Cadence</Text>
          <Text className="mt-2 max-w-[280px] text-center text-base leading-relaxed text-neutral-300">
            Stay focused, build momentum, and turn study sessions into a daily rhythm.
          </Text>
          <View className="mt-10 w-full max-w-[280px]">
            <GradientButton title="Get started" onPress={next} />
          </View>
        </View>
      </View>
    );
  }

  if (step >= 1 && step <= 4) {
    const featureIndex = step - 1;
    const feature = features[featureIndex];
    const Visual = feature.Visual;

    return (
      <View className="relative flex-1 justify-end bg-ink-950">
        <View className="relative z-10 flex-1 items-center justify-center px-8">
          <Animated.View
            key={feature.key}
            entering={FadeInRight.springify().damping(24).stiffness(200)}
            exiting={FadeOutLeft.springify().damping(24).stiffness(200)}
            className="w-full max-w-[300px]">
            <Visual />
          </Animated.View>
        </View>
        <View className="relative z-20 px-8 pb-12 text-center">
          <OnboardingDots total={4} current={featureIndex} />
          <Text className="font-display mt-5 text-center text-3xl text-white">{feature.title}</Text>
          <Text className="mt-3 text-center text-[15px] leading-relaxed text-neutral-400">
            {feature.subtitle}
          </Text>
          <View className="mt-8 flex-row gap-3">
            <Pressable
              onPress={goHome}
              className="flex-1 items-center justify-center rounded-full py-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text className="text-[15px] font-semibold text-white">Skip</Text>
            </Pressable>
            <View className="flex-1">
              <GradientButton title="Next" onPress={next} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return <Paywall onStart={goHome} onClose={goHome} />;
}
