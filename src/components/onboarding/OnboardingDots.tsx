import { View } from 'react-native';

interface OnboardingDotsProps {
  total: number;
  current: number;
}

export function OnboardingDots({ total, current }: OnboardingDotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current ? 'w-5 bg-ember-400' : 'w-1.5 bg-ink-600'
          }`}
        />
      ))}
    </View>
  );
}
