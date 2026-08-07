import { Pressable, Text, View } from 'react-native';
import { PauseIcon, PlayIcon, SquareIcon, ShieldCheckIcon } from 'lucide-react-native';
import { CircularTimer } from '../CircularTimer';
import { ambientSounds } from '../../data/ambientSounds';
import { formatCountdown } from '../../utils/time';
import { Task } from '../../types/task';
import { Glass } from '../ui/Glass';

interface ActiveSessionProps {
  sessionType: 'focus' | 'break';
  secondsLeft: number;
  totalSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  soundId: string;
  blockingEnabled: boolean;
  activeTask?: Task;
}

export function ActiveSession({
  sessionType,
  secondsLeft,
  totalSeconds,
  isPaused,
  onTogglePause,
  onEnd,
  soundId,
  blockingEnabled,
  activeTask,
}: ActiveSessionProps) {
  const progress = 1 - secondsLeft / totalSeconds;
  const sound = ambientSounds.find((s) => s.id === soundId) ?? ambientSounds[0];
  const SoundIcon = sound.icon;

  return (
    <View className="flex-1 items-center px-5 pb-6 pt-10">
      <Text className="text-sm font-medium uppercase tracking-wide text-neutral-400">
        {sessionType === 'focus' ? 'Focusing' : 'Break'}
      </Text>
      {activeTask && sessionType === 'focus' && (
        <Text className="mt-1 max-w-[220px] text-sm text-white" numberOfLines={1}>
          {activeTask.title}
        </Text>
      )}

      <View className="relative mt-8">
        <View
          className="absolute rounded-full bg-ember-500/10 blur-2xl"
          style={{ top: 24, bottom: 24, left: 24, right: 24 }}
        />
        <CircularTimer progress={progress} size={240} strokeWidth={12}>
          <View className="text-center">
            <Text className="font-display text-5xl text-white" style={{ fontVariant: ['tabular-nums'] }}>
              {formatCountdown(secondsLeft)}
            </Text>
            {isPaused && <Text className="mt-1 text-xs font-medium text-ember-400">Paused</Text>}
          </View>
        </CircularTimer>
      </View>

      <View className="mt-10 flex-row items-center gap-4">
        <Pressable
          onPress={onEnd}
          accessibilityLabel="End session"
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}>
          <SquareIcon size={16} color="#d4d4d4" />
        </Pressable>
        <Pressable
          onPress={onTogglePause}
          accessibilityLabel={isPaused ? 'Resume' : 'Pause'}
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: '#fb923c',
            shadowColor: '#fb923c',
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 48,
            shadowOpacity: 0.4,
            elevation: 24,
          }}>
          {isPaused ? <PlayIcon size={24} color="#0a0d10" /> : <PauseIcon size={24} color="#0a0d10" />}
        </Pressable>
        <View className="h-12 w-12" />
      </View>

      {sessionType === 'focus' && (
        <View className="mt-10 w-full gap-2.5">
          <Glass className="flex-row items-center gap-3 rounded-2xl px-4 py-3">
            <SoundIcon size={16} color="#fb923c" className="shrink-0" />
            <Text className="flex-1 text-sm text-white">{sound.name}</Text>
            <Text className="text-xs text-neutral-400">Playing</Text>
          </Glass>
          {blockingEnabled && (
            <Glass className="flex-row items-center gap-3 rounded-2xl px-4 py-3">
              <ShieldCheckIcon size={16} color="#fb923c" className="shrink-0" />
              <Text className="flex-1 text-sm text-white">Distractions blocked</Text>
              <Text className="text-xs text-neutral-400">Active</Text>
            </Glass>
          )}
        </View>
      )}
    </View>
  );
}
