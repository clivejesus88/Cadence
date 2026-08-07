import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

const variants = {
  default: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.09)',
    blur: 18,
    shadowOpacity: 0.35,
    shadowRadius: 22,
  },
  strong: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    blur: 28,
    shadowOpacity: 0.45,
    shadowRadius: 30,
  },
  pill: {
    backgroundColor: 'rgba(18,20,24,0.6)',
    borderColor: 'rgba(255,255,255,0.1)',
    blur: 24,
    shadowOpacity: 0.4,
    shadowRadius: 26,
  },
  inset: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.07)',
    blur: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },
};

interface GlassProps {
  children?: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Glass({ children, variant = 'default', className = '', style }: GlassProps) {
  const v = variants[variant];
  return (
    <View
      className={className}
      style={[
        styles.base,
        {
          backgroundColor: v.backgroundColor,
          borderColor: v.borderColor,
          shadowOpacity: v.shadowOpacity,
          shadowRadius: v.shadowRadius,
        },
        style,
      ]}>
      {v.blur > 0 ? (
        <BlurView tint="dark" intensity={v.blur} style={StyleSheet.absoluteFill} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});
