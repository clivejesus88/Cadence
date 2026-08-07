import React, { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
}

function AmbientBlobs() {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <View className="absolute -top-16 -right-12 h-80 w-80 rounded-full bg-ember-500/20" />
      <View className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-sky-500/12" />
      <View className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-violet-500/12" />
    </View>
  );
}

export function Screen({ children, scroll = true, className = '', contentClassName = '' }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + 24;
  const bottomPadding = Math.max(insets.bottom, 16) + 116;

  if (scroll) {
    return (
      <View className={`flex-1 bg-ink-950 ${className}`}>
        <AmbientBlobs />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: topPadding, paddingBottom: bottomPadding }}
          contentContainerClassName={`px-5 ${contentClassName}`}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-ink-950 ${className}`}>
      <AmbientBlobs />
      <View
        style={{ paddingTop: topPadding, paddingBottom: bottomPadding }}
        className={`flex-1 px-5 ${contentClassName}`}>
        {children}
      </View>
    </View>
  );
}
