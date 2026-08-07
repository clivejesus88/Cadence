import { Pressable, ScrollView, Text, View } from 'react-native';
import { ShieldCheckIcon } from 'lucide-react-native';
import { ambientSounds } from '../../data/ambientSounds';
import { blockedApps } from '../../data/blockedApps';
import { Task } from '../../types/task';
import { GradientButton } from '../ui/GradientButton';
import { Glass } from '../ui/Glass';

interface SessionSetupProps {
  durationMinutes: number;
  onChangeDuration: (m: number) => void;
  soundId: string;
  onChangeSound: (id: string) => void;
  blockingEnabled: boolean;
  onToggleBlocking: (v: boolean) => void;
  activeTask?: Task;
  onStart: () => void;
}

const presets = [15, 25, 50, 90];

export function SessionSetup({
  durationMinutes,
  onChangeDuration,
  soundId,
  onChangeSound,
  blockingEnabled,
  onToggleBlocking,
  activeTask,
  onStart,
}: SessionSetupProps) {
  return (
    <View className="px-5 pb-4">
      <Text className="font-display text-2xl text-white">Focus Session</Text>
      <Text className="mt-1 text-sm text-neutral-400">Set up your session, then dive in.</Text>

      {activeTask && (
        <Glass className="mt-5 flex-row items-center gap-3 rounded-2xl px-4 py-3">
          <View className="h-2 w-2 shrink-0 rounded-full bg-ember-400" />
          <View className="min-w-0">
            <Text className="text-sm text-white" numberOfLines={1}>
              {activeTask.title}
            </Text>
            <Text className="text-xs text-neutral-400">{activeTask.subject}</Text>
          </View>
        </Glass>
      )}

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Duration</Text>
        <View className="flex-row gap-2">
          {presets.map((p) => (
            <Pressable
              key={p}
              onPress={() => onChangeDuration(p)}
              className={`flex-1 rounded-2xl py-3 ${
                durationMinutes === p
                  ? 'bg-ember-500'
                  : 'border border-white/10 bg-white/5'
              }`}>
              <Text
                className={`text-center text-sm font-semibold ${
                  durationMinutes === p ? 'text-ink-950' : 'text-neutral-300'
                }`}>
                {p}m
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Focus Sound</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
          {ambientSounds.map((s) => {
            const Icon = s.icon;
            const selected = soundId === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => onChangeSound(s.id)}
                className={`w-24 rounded-2xl p-3 ${
                  selected
                    ? 'border border-ember-400 bg-ember-500/15'
                    : 'border border-white/10 bg-white/5'
                }`}>
                <Icon size={20} color={selected ? '#fb923c' : '#a3a3a3'} />
                <Text className={`mt-2 text-xs font-medium ${selected ? 'text-white' : 'text-neutral-300'}`}>
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="mt-6">
        <Pressable
          onPress={() => onToggleBlocking(!blockingEnabled)}
          className="w-full flex-row items-center justify-between rounded-2xl px-4 py-3.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}>
          <View className="flex-row items-center gap-3">
            <ShieldCheckIcon size={20} color={blockingEnabled ? '#fb923c' : '#737373'} />
            <View>
              <Text className="text-sm font-medium text-white">Block Distractions</Text>
              <Text className="text-xs text-neutral-400">
                {blockedApps.filter((a) => a.blockedByDefault).length} apps muted during focus
              </Text>
            </View>
          </View>
          <View
            className={`flex h-6 w-11 items-center rounded-full px-0.5 ${
              blockingEnabled ? 'justify-end bg-ember-500' : 'justify-start bg-white/10'
            }`}>
            <View className="h-5 w-5 rounded-full bg-white" />
          </View>
        </Pressable>
      </View>

      <View className="mt-8">
        <GradientButton title="Start Focusing" onPress={onStart} />
      </View>
    </View>
  );
}
