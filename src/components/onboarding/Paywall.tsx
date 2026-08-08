import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { XIcon, SparklesIcon, PaletteIcon, LineChartIcon, ShieldCheckIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { heroImage } from '../../constants/theme';
import { GradientButton } from '../ui/GradientButton';

interface PaywallProps {
  onStart: () => void;
  onClose: () => void;
}

const benefits = [
  { icon: SparklesIcon, title: 'Unlimited custom sessions', desc: 'Create any timer length for any subject.', bg: '#0ea5e9' },
  { icon: ShieldCheckIcon, title: 'Advanced blocking rules', desc: 'Block by schedule, app, or website.', bg: '#059669' },
  { icon: LineChartIcon, title: 'Deeper insights', desc: 'See patterns across months, not just weeks.', bg: '#8b5cf6' },
  { icon: PaletteIcon, title: 'Premium soundscapes', desc: 'Unlock every focus sound in the library.', bg: '#f59e0b' },
];

export function Paywall({ onStart, onClose }: PaywallProps) {
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');

  return (
    <View className="flex-1 bg-ink-950">
      <Image
        source={heroImage}
        className="absolute inset-0 h-full w-full"
        style={{ transform: [{ scale: 1.1 }] }}
        blurRadius={40}
      />
      <View className="absolute inset-0 bg-ink-950/50" />
      <LinearGradient
        colors={['rgba(234,88,12,0.35)', 'rgba(245,158,11,0.1)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <Pressable
        onPress={onClose}
        accessibilityLabel="Skip Pro"
        className="absolute right-5 top-6 z-20 h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <XIcon size={20} color="#ffffff" />
      </Pressable>

      <ScrollView
        className="z-10 flex-1"
        contentContainerClassName="px-6 pb-36 pt-16"
        showsVerticalScrollIndicator={false}>
        <View className="mx-auto w-60 -rotate-6 rounded-2xl px-4 pb-4 pt-3" style={{ backgroundColor: '#f3efe6' }}>
          <View className="flex-row justify-between">
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} className="h-1 w-1 rounded-full bg-black/15" />
            ))}
          </View>
          <View className="mt-2.5 flex-row items-center justify-between">
            <Text className="text-[13px] font-bold text-ink-950">
              Focus Pass{' '}
              <Text className="ml-1 rounded bg-ember-500/15 px-1 py-0.5 text-[9px] font-bold text-ember-600">
                NEW
              </Text>
            </Text>
            <Text className="font-display text-sm italic text-ink-950/50">Cadence</Text>
          </View>
          <View className="mt-3 gap-2">
            <View>
              <Text className="text-[9px] uppercase tracking-wide text-ink-950/40">Student</Text>
              <Text className="text-xs font-medium text-ink-950/80">Alex</Text>
            </View>
            <View>
              <Text className="text-[9px] uppercase tracking-wide text-ink-950/40">Focus goal</Text>
              <Text className="text-xs font-medium text-ink-950/80">Deep Work</Text>
            </View>
            <View>
              <Text className="text-[9px] uppercase tracking-wide text-ink-950/40">Signed</Text>
              <Text className="font-display text-sm italic text-ink-950/70">Alex R.</Text>
            </View>
          </View>
          <View className="mt-3 flex-row justify-between">
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} className="h-1 w-1 rounded-full bg-black/15" />
            ))}
          </View>
        </View>

        <Text className="mt-6 text-center font-display text-3xl tracking-tight text-white">
          Cadence <Text className="italic text-ember-400">pro</Text>
        </Text>
        <Text className="mx-auto mt-2 max-w-[240px] text-center text-sm leading-6 text-neutral-400">
          Launch special is on!
          {'\n'}
          Unlock your best study habits now!
        </Text>

        <View className="mt-7 gap-3">
          <View className="relative">
            <View className="absolute -top-2.5 left-4 z-10 rounded-full px-2.5 py-1" style={{ backgroundColor: '#f59e0b' }}>
              <Text className="text-[10px] font-bold text-white">Save 40%</Text>
            </View>
            <Pressable
              onPress={() => setPlan('yearly')}
              accessibilityRole="radio"
              accessibilityState={{ selected: plan === 'yearly' }}
              className="w-full rounded-2xl px-4 py-4"
              style={{
                backgroundColor: plan === 'yearly' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: plan === 'yearly' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)',
              }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">Yearly</Text>
                <View className="flex-row items-center gap-2.5">
                  <Text className="text-xs text-neutral-300">$3.99/mo</Text>
                  {plan === 'yearly' ? (
                    <View className="h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-white">
                      <View className="h-2 w-2 rounded-full bg-white" />
                    </View>
                  ) : (
                    <View className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-white/30" />
                  )}
                </View>
              </View>
              <Text className="mt-1 text-xs text-neutral-400">$47.99/yr</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setPlan('monthly')}
            accessibilityRole="radio"
            accessibilityState={{ selected: plan === 'monthly' }}
            className="w-full rounded-2xl px-4 py-4"
            style={{
              backgroundColor: plan === 'monthly' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: plan === 'monthly' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)',
            }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">Monthly</Text>
              <View className="flex-row items-center gap-2.5">
                <Text className="text-xs text-neutral-300">$6.99/mo</Text>
                {plan === 'monthly' ? (
                  <View className="h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-white">
                    <View className="h-2 w-2 rounded-full bg-white" />
                  </View>
                ) : (
                  <View className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-white/30" />
                )}
              </View>
            </View>
          </Pressable>
        </View>

        <View className="mt-8">
          <Text className="text-lg font-bold text-white">PRO Benefits</Text>
          <View className="mt-4 gap-5">
            {benefits.map(({ icon: Icon, title, desc, bg }) => (
              <View key={title} className="flex-row items-start gap-3">
                <View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                  <Icon size={18} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">{title}</Text>
                  <Text className="text-xs text-neutral-400">{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 z-20 px-6 pb-8 pt-10">
        <LinearGradient
          colors={['rgba(10,13,16,0)', 'rgba(10,13,16,0.95)', '#0a0d10']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <GradientButton
          title="Start Cadence"
          onPress={onStart}
          gradient={['#f59e0b', '#ea580c', '#ea580c']}
        />
      </View>
    </View>
  );
}
