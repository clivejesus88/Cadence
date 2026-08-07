
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

cssInterop(LinearGradient, { className: 'style' });

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: readonly [string, string, ...string[]];
  className?: string;
  style?: StyleProp<ViewStyle>;
  textClassName?: string;
}

export function GradientButton({
  title,
  onPress,
  gradient = ['#fb923c', '#f59e0b', '#ea580c'] as const,
  className = '',
  style,
  textClassName = '',
}: GradientButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={className}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}>
      <LinearGradient
        className="w-full items-center rounded-full py-4"
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        <Text className={`text-[15px] font-sans-bold text-ink-950 ${textClassName}`}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}
