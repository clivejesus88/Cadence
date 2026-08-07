import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { FlameIcon, ArrowRightIcon, ChevronRightIcon, TimerIcon, LightbulbIcon } from 'lucide-react-native';
import { useAppData } from '../contexts/AppDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatMinutes, getGreeting } from '../utils/time';
import { focusTips } from '../data/insightsTips';
import { WeeklyPreview } from '../components/home/WeeklyPreview';
import { TaskPreviewList } from '../components/home/TaskPreviewList';
import { WelcomeModal } from '../components/home/WelcomeModal';
import { Screen } from '../components/ui/Screen';
import { Glass } from '../components/ui/Glass';

export function Home() {
  const router = useRouter();
  const { currentStreak, todayMinutes, tasks, weeklyData } = useAppData();
  const { profile, hasSeenWelcome, dismissWelcome } = useSettings();
  const todaysTasks = tasks.filter((t) => !t.completed).slice(0, 3);
  const firstName = profile.name.split(' ')[0];

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Open profile and settings">
            <Image
              source={profile.avatarUrl}
              className="h-11 w-11 rounded-full"
              style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' }}
            />
          </Pressable>
          <View>
            <Text className="text-sm text-neutral-400">{getGreeting()}</Text>
            <Text className="font-display text-2xl text-white">{firstName}</Text>
          </View>
        </View>
        <View
          className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
          style={{ backgroundColor: 'rgba(18,20,24,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <FlameIcon size={16} color="#fb923c" />
          <Text className="flex-row items-center text-sm font-semibold text-white">
            {currentStreak}
            <Text className="ml-0.5 font-medium text-neutral-400"> day streak</Text>
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/focus')}
        className="mt-6 w-full rounded-3xl p-5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.45,
          shadowRadius: 30,
          elevation: 10,
        }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[13px] font-semibold tracking-wide text-ember-300">
              START A SESSION
            </Text>
          </View>
          <ArrowRightIcon size={16} color="#fb923c" />
        </View>
        <Text className="font-display mt-2 text-2xl leading-snug text-white">
          Ready for 25 minutes of focused work?
        </Text>
        <Text className="mt-1.5 text-sm text-neutral-400">
          Lock in. Block out distractions. Get into flow.
        </Text>
      </Pressable>

      <View className="mt-6">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-white">Today</Text>
          <View className="flex-row items-center gap-1">
            <TimerIcon size={14} color="#a3a3a3" />
            <Text className="text-xs text-neutral-400">{formatMinutes(todayMinutes)}</Text>
          </View>
        </View>
        <TaskPreviewList tasks={todaysTasks} />
      </View>

      <View className="mt-8">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-white">This week</Text>
          <Pressable onPress={() => router.push('/insights')} className="flex-row items-center gap-1">
            <Text className="text-xs font-semibold text-ember-400">View insights</Text>
            <ChevronRightIcon size={14} color="#fb923c" />
          </Pressable>
        </View>
        <WeeklyPreview data={weeklyData} />
      </View>

      <View className="mt-8">
        <Text className="mb-3 text-sm font-semibold text-white">Daily tip</Text>
        <Glass className="flex-row items-start gap-3 rounded-2xl p-4">
          <View className="mt-0.5 shrink-0">
            <LightbulbIcon size={16} color="#fb923c" />
          </View>
          <Text className="flex-1 text-sm leading-relaxed text-neutral-300">{focusTips[0]}</Text>
        </Glass>
      </View>

      {!hasSeenWelcome && <WelcomeModal name={profile.name} onDismiss={dismissWelcome} />}
    </Screen>
  );
}
