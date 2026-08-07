import React, { ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { HomeIcon, TimerIcon, BarChart3Icon, ListChecksIcon } from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router';

const NAV_H_PADDING = 6;
const ITEMS = [
  { name: 'home', label: 'Home', Icon: HomeIcon },
  { name: 'focus', label: 'Focus', Icon: TimerIcon },
  { name: 'insights', label: 'Insights', Icon: BarChart3Icon },
  { name: 'planner', label: 'Planner', Icon: ListChecksIcon },
];

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedIndex = state.index;

  const containerWidth = useSharedValue(0);
  const pillX = useSharedValue(0);

  const pillStyle = useAnimatedStyle(() => {
    const tabWidth = Math.max(1, (containerWidth.value - NAV_H_PADDING * 2) / ITEMS.length);
    return {
      width: tabWidth,
      transform: [{ translateX: pillX.value }],
    };
  });

  useEffect(() => {
    const tabWidth = Math.max(1, (containerWidth.value - NAV_H_PADDING * 2) / ITEMS.length);
    pillX.value = withSpring(focusedIndex * tabWidth, {
      stiffness: 520,
      damping: 38,
      mass: 0.8,
    });
  }, [focusedIndex, containerWidth.value, pillX]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View
        onLayout={(e) => {
          containerWidth.value = e.nativeEvent.layout.width;
        }}
        style={styles.nav}>
        <BlurView tint="dark" intensity={32} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.pill, pillStyle]} />
        {ITEMS.map(({ name, label, Icon }, index) => {
          const isFocused = index === focusedIndex;
          const iconColor = isFocused ? '#fb923c' : '#a3a3a3';
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state.routes[index].key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(name);
                }
              }}
              style={styles.item}>
              <Icon size={22} color={iconColor} strokeWidth={isFocused ? 2.3 : 1.9} />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? '#ffffff' : '#a3a3a3' },
                  isFocused ? styles.labelFocused : styles.labelMuted,
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface TabLayoutProps {
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  descriptors: BottomTabBarProps['descriptors'];
  children: ReactNode;
}

export function TabBarLayout({ state, navigation, descriptors, children }: TabLayoutProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>{children}</View>
      <FloatingTabBar state={state} navigation={navigation} descriptors={descriptors} insets={{ top: 0, bottom: 0, left: 0, right: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0d10',
  },
  content: {
    flex: 1,
  },
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    zIndex: 30,
  },
  nav: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: NAV_H_PADDING,
    paddingHorizontal: NAV_H_PADDING,
    backgroundColor: 'rgba(16,18,22,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    ...(globalThis.Platform?.OS === 'web'
      ? { boxShadow: '0 18px 40px -12px rgba(0,0,0,0.75), 0 2px 10px rgba(0,0,0,0.35)' }
      : {}),
  },
  pill: {
    position: 'absolute',
    left: NAV_H_PADDING,
    top: NAV_H_PADDING,
    bottom: NAV_H_PADDING,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  labelFocused: {
    fontWeight: '600',
  },
  labelMuted: {
    fontWeight: '500',
  },
});
