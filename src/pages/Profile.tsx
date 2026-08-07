import { Children, ReactNode } from 'react';
import { Image } from 'react-native';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeftIcon,
  FlameIcon,
  ClockIcon,
  ListChecksIcon,
  TimerIcon,
  CoffeeIcon,
  PlayIcon,
  BellIcon,
  MailIcon,
  ShieldCheckIcon,
  LockIcon,
  CreditCardIcon,
  LogOutIcon,
  BoxIcon,
  SparklesIcon,
} from 'lucide-react-native';
import { useAppData } from '../contexts/AppDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { SettingRow } from '../components/profile/SettingRow';
import { ToggleSwitch } from '../components/profile/ToggleSwitch';
import { Screen } from '../components/ui/Screen';
import { Glass } from '../components/ui/Glass';

const durationOptions = [15, 25, 50, 90];
const breakOptions = [5, 10, 15];

function SettingsList({ children }: { children: ReactNode[] }) {
  return (
    <Glass className="rounded-2xl">
      {Children.map(children, (child, i) => (
        <View
          key={i}
          style={i > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' } : undefined}>
          {child}
        </View>
      ))}
    </Glass>
  );
}

function Pills({
  options,
  selected,
  onSelect,
}: {
  options: number[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View className="flex-row gap-1.5">
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onSelect(o)}
          className={`rounded-xl p-2 ${selected === o ? 'bg-ember-500' : 'bg-white/5'}`}>
          <Text className={`text-xs font-semibold ${selected === o ? 'text-ink-950' : 'text-neutral-300'}`}>
            {o}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Profile() {
  const router = useRouter();
  const { currentStreak, totalSessionsCompleted, sessions } = useAppData();
  const { profile, preferences, updatePreference } = useSettings();

  const totalMinutes = sessions
    .filter((s) => s.type === 'focus' && s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/home');
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={goBack}
          accessibilityLabel="Back to dashboard"
          className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <ChevronLeftIcon size={20} color="#d4d4d4" />
        </Pressable>
        <Text className="font-display text-2xl text-white">Profile</Text>
      </View>

      <View
        className="mt-6 rounded-3xl p-5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
        }}>
        <View className="flex-row items-center gap-4">
          <Image
            source={profile.avatarUrl}
            className="h-16 w-16 shrink-0 rounded-full"
            style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}
          />
          <View className="min-w-0 flex-1">
            <Text className="text-xs uppercase tracking-wide text-neutral-400">
              Member since {profile.memberSince}
            </Text>
            <Text className="font-display mt-0.5 text-xl text-white">{profile.name}</Text>
            <Text className="mt-0.5 text-sm text-neutral-400">{profile.email}</Text>
            <Text className="mt-0.5 text-sm text-neutral-500">{profile.school}</Text>
          </View>
          <View className="flex-row items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <SparklesIcon size={14} color="#fb923c" />
            <Text className="text-xs font-semibold text-white">
              {profile.plan === 'pro' ? 'Pro' : 'Free'}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Today</Text>
        <View className="flex-row gap-2">
          <View className="flex-1 items-center rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}>
            <FlameIcon size={16} color="#fb923c" />
            <Text className="mt-1 text-2xl font-semibold text-white">{currentStreak}</Text>
            <Text className="mt-0.5 text-xs text-neutral-400">Day streak</Text>
          </View>
          <View className="flex-1 items-center rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}>
            <ClockIcon size={16} color="#fb923c" />
            <Text className="mt-1 text-2xl font-semibold text-white">{totalMinutes}</Text>
            <Text className="mt-0.5 text-xs text-neutral-400">Minutes focused</Text>
          </View>
          <View className="flex-1 items-center rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}>
            <ListChecksIcon size={16} color="#fb923c" />
            <Text className="mt-1 text-2xl font-semibold text-white">{totalSessionsCompleted}</Text>
            <Text className="mt-0.5 text-xs text-neutral-400">Sessions</Text>
          </View>
        </View>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Focus sessions</Text>
        <SettingsList>
          <SettingRow
            icon={TimerIcon}
            title="Default session"
            description="Duration for new sessions"
            control={<Pills options={durationOptions} selected={preferences.defaultDuration} onSelect={(v) => updatePreference('defaultDuration', v)} />}
          />
          <SettingRow
            icon={CoffeeIcon}
            title="Break length"
            description="How long breaks last"
            control={<Pills options={breakOptions} selected={preferences.breakLength} onSelect={(v) => updatePreference('breakLength', v)} />}
          />
          <SettingRow
            icon={PlayIcon}
            title="Auto-start breaks"
            description="Begin breaks automatically"
            control={
              <ToggleSwitch
                checked={preferences.autoStartBreaks}
                onChange={(v) => updatePreference('autoStartBreaks', v)}
                label="Auto-start breaks"
              />
            }
          />
        </SettingsList>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Notifications</Text>
        <SettingsList>
          <SettingRow
            icon={BellIcon}
            title="Session reminders"
            description="Ping when your session starts and ends"
            control={
              <ToggleSwitch
                checked={preferences.sessionReminders}
                onChange={(v) => updatePreference('sessionReminders', v)}
                label="Session reminders"
              />
            }
          />
          <SettingRow
            icon={SparklesIcon}
            title="Daily summary"
            description="Morning recap of yesterday's focus"
            control={
              <ToggleSwitch
                checked={preferences.dailySummary}
                onChange={(v) => updatePreference('dailySummary', v)}
                label="Daily summary"
              />
            }
          />
        </SettingsList>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Blocking</Text>
        <SettingsList>
          <SettingRow
            icon={ShieldCheckIcon}
            title="Block during focus"
            description="Silence apps while you focus"
            control={
              <ToggleSwitch
                checked={preferences.blockDuringFocus}
                onChange={(v) => updatePreference('blockDuringFocus', v)}
                label="Block during focus"
              />
            }
          />
          <SettingRow
            icon={LockIcon}
            title="Strict mode"
            description="No skipping a session before it ends"
            control={
              <ToggleSwitch
                checked={preferences.strictMode}
                onChange={(v) => updatePreference('strictMode', v)}
                label="Strict mode"
              />
            }
          />
          <SettingRow icon={ListChecksIcon} title="Managed apps" description="Choose which apps get blocked" />
        </SettingsList>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Account</Text>
        <SettingsList>
          <SettingRow icon={MailIcon} title="Email" description={profile.email} />
          <SettingRow icon={ShieldCheckIcon} title="Security" description="Manage password & 2FA" />
          <SettingRow icon={BoxIcon} title="Help & support" description="Tips, FAQs, and contact us" />
        </SettingsList>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-semibold text-white">Subscription</Text>
        <SettingsList>
          <SettingRow
            icon={CreditCardIcon}
            title={profile.plan === 'pro' ? 'Cadence Pro' : 'Free plan'}
            description="Manage billing & plans"
          />
        </SettingsList>
      </View>

      <View className="mb-4 mt-6">
        <SettingRow icon={LogOutIcon} title="Log out" danger />
      </View>
    </Screen>
  );
}
