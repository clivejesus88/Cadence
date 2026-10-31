
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, ChevronLeftIcon, FlameIcon, ListChecksIcon, TimerIcon, CoffeeIcon, PlayIcon, BellIcon, MailIcon, ShieldCheckIcon, CalendarClockIcon, LockIcon, CreditCardIcon, UserRoundIcon, LogOutIcon, BoxIcon, TargetIcon } from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { formatMinutes } from "../utils/time";
import { notifySupport } from "../utils/notify";
import { notifyError } from "../utils/notify";
import { enablePush, disablePush, pushSupported } from "../utils/push";
import { SettingRow } from "../components/profile/SettingRow";
import { ToggleSwitch } from "../components/profile/ToggleSwitch";
import { EditProfileSheet } from "../components/profile/EditProfileSheet";
import { Avatar } from "../components/profile/Avatar";
import { BadgeGrid } from "../components/gamified/BadgeGrid";
import { levelFromXp } from "../utils/gamification";
import { useState } from "react";
const durationOptions = [15, 25, 50, 90];
const breakOptions = [5, 10, 15];
const goalOptions = [30, 60, 90, 120];
export function Profile() {
  const navigate = useNavigate();
  const { signOut, isGuest, user } = useAuth();
  const {
    currentStreak,
    totalSessionsCompleted,
    sessions,
    level,
    badges,
    dailyGoalMinutes
  } = useAppData();
  const {
    profile,
    preferences,
    updatePreference
  } = useSettings();
  const [editing, setEditing] = useState(false);
  const [badgesExpanded, setBadgesExpanded] = useState(false);

  const reminderKeys = ['sessionReminders', 'taskReminders', 'dailySummary'] as const;
  const handleReminderToggle = async (key: typeof reminderKeys[number], value: boolean) => {
    updatePreference(key, value);
    if (!value || isGuest || !user) return;
    if (!pushSupported()) {
      notifyError('Push notifications unavailable', 'This browser does not support out-of-app push notifications. In-app reminders remain available.');
      return;
    }
    try {
      const ok = await enablePush(user.id);
      if (!ok) {
        updatePreference(key, false);
        notifyError('Notifications are off', 'Allow notifications in your browser or device settings, then try again.');
      }
    } catch (error) {
      updatePreference(key, false);
      notifyError('Could not enable notifications', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleEnableDeviceNotifications = async () => {
    if (!user) return;
    try {
      const enabled = await enablePush(user.id);
      if (!enabled) {
        notifyError('Notifications are off', 'Allow notifications in your browser or device settings, then try again.');
      }
    } catch (error) {
      notifyError('Could not enable notifications', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const allRemindersOff =
    !preferences.sessionReminders && !preferences.taskReminders && !preferences.dailySummary;
  const totalMinutes = sessions.filter((s) => s.type === 'focus' && s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
  const earnedBadges = badges.filter((badge) => badge.earned).length;
  const xpToNextLevel = Math.max(0, level.xpForLevel - level.xpIntoLevel);
  const nextLevel = level.level < 99 ? levelFromXp(level.xp + xpToNextLevel) : null;

  const handleSignOut = async () => {
    try {
      await disablePush();
    } catch (error) {
      notifyError('Could not disable notifications', error instanceof Error ? error.message : 'Please try again before signing out.');
      return;
    }
    await signOut();
    navigate('/', { replace: true });
  };
  return <div className="px-5 pb-10 pt-6 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-7 lg:px-8 lg:pt-8">
      <header className="mb-6 flex items-center gap-3 lg:col-span-2 lg:mb-0">
        <button onClick={() => navigate('/app/home')} aria-label="Back to dashboard" className="hit-slop flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/[0.05] hover:text-white active:scale-95">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl text-white">Profile</h1>
      </header>

      <section className="lg:col-span-2">
        <div className="flex items-center gap-3.5">
          <Avatar value={profile.avatarUrl} className="h-[4.25rem] w-[4rem] flex-shrink-0" alt={profile.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-script text-[2.25rem] leading-none text-white">{profile.name || 'Your name'}</p>
            <p className="mt-1 truncate text-xs text-neutral-500">
              {profile.school || profile.email || (isGuest ? 'Guest account' : 'Cadence member')}
              {profile.plan === 'pro' ? ' · Pro' : ''}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit profile"
            className="hit-slop flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/[0.05] hover:text-white active:scale-95">
            <UserRoundIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500">
          <FlameIcon className="h-3.5 w-3.5 text-ember-400" />
          <span>{currentStreak} day streak</span>
          <span className="text-neutral-700">·</span>
          <span>{formatMinutes(totalMinutes)} focused</span>
          <span className="text-neutral-700">·</span>
          <span>{totalSessionsCompleted} sessions</span>
        </div>
      </section>

      <section className="mt-6 lg:col-span-2 lg:mt-0">
        <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,28,32,0.94),rgba(13,15,18,0.97))] shadow-[0_18px_42px_-30px_rgba(0,0,0,0.9)]">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Focus level</p>
                <div className="mt-2 flex items-baseline gap-2.5">
                  <span className="font-display text-[2.75rem] leading-none tracking-tight text-white">{String(level.level).padStart(2, '0')}</span>
                  <span className="truncate font-display text-xl leading-none text-neutral-300">{level.title}</span>
                </div>
              </div>
              <div className="mt-1 max-w-[42%] text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                  {nextLevel ? `Next · ${String(level.level + 1).padStart(2, '0')}` : 'Highest level'}
                </p>
                {nextLevel && <p className="mt-1 truncate font-display text-sm text-neutral-300">{nextLevel.title}</p>}
              </div>
            </div>

            <div className="mt-5">
              <div
                role="progressbar"
                aria-label={`Progress within level ${level.level}`}
                aria-valuemin={0}
                aria-valuemax={level.xpForLevel}
                aria-valuenow={level.xpIntoLevel}
                className="relative h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ember-400 via-amber-300 to-amber-100 transition-[width]"
                  style={{ width: `${level.progress * 100}%` }}
                />
                <div aria-hidden="true" className="absolute inset-y-0 left-1/4 w-px bg-[#15191d]/60" />
                <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-[#15191d]/60" />
                <div aria-hidden="true" className="absolute inset-y-0 left-3/4 w-px bg-[#15191d]/60" />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium tabular-nums text-neutral-300">
                  {level.xpIntoLevel} <span className="text-neutral-600">/</span> {level.xpForLevel} XP
                </span>
                <span className="text-[10px] tabular-nums text-neutral-500">
                  {nextLevel ? `${xpToNextLevel} XP to next level` : 'All levels complete'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={badgesExpanded}
            onClick={() => setBadgesExpanded((expanded) => !expanded)}
            className="flex w-full items-center justify-between border-t border-white/[0.07] px-5 py-3 text-left transition-colors hover:bg-white/[0.02]">
            <span className="text-[11px] text-neutral-400">
              Badges <span className="ml-1 text-neutral-600">{earnedBadges} / {badges.length} earned</span>
            </span>
            <ChevronDownIcon className={`h-4 w-4 text-neutral-500 transition-transform ${badgesExpanded ? 'rotate-180' : ''}`} />
          </button>
          {badgesExpanded && <BadgeGrid badges={badges} className="border-t border-white/[0.06] px-4 py-3" />}
        </div>
      </section>

      <section className="mt-7 lg:mt-0">
        <div className="mb-3 px-1">
          <h2 className="text-sm font-semibold text-white">Focus preferences</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Shape your sessions around you</p>
        </div>
        <div className="glass divide-y divide-white/[0.06] overflow-hidden rounded-[24px]">
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                <TimerIcon className="h-4 w-4 text-neutral-300" />
              </div>
              <p className="flex-1 text-sm font-medium text-white">Default session</p>
            </div>
            <div className="mt-3 flex gap-2">
              {durationOptions.map((d) => <button key={d} onClick={() => updatePreference('defaultDuration', d)} aria-pressed={preferences.defaultDuration === d} className={`flex-1 rounded-xl py-3 text-xs font-semibold transition-all active:scale-95 ${preferences.defaultDuration === d ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`}>
                  {d}m
                </button>)}
            </div>
          </div>

          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                <CoffeeIcon className="h-4 w-4 text-neutral-300" />
              </div>
              <p className="flex-1 text-sm font-medium text-white">Break length</p>
            </div>
            <div className="mt-3 flex gap-2">
              {breakOptions.map((b) => <button key={b} onClick={() => updatePreference('breakLength', b)} aria-pressed={preferences.breakLength === b} className={`flex-1 rounded-xl py-3 text-xs font-semibold transition-all active:scale-95 ${preferences.breakLength === b ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`}>
                  {b}m
                </button>)}
            </div>
          </div>

          <SettingRow icon={PlayIcon} title="Auto-start breaks" description="Roll straight into a break when a session ends." control={<ToggleSwitch label="Auto-start breaks" checked={preferences.autoStartBreaks} onChange={(v) => updatePreference('autoStartBreaks', v)} />} />

          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                <TargetIcon className="h-4 w-4 text-neutral-300" />
              </div>
              <p className="flex-1 text-sm font-medium text-white">Daily focus goal</p>
            </div>
            <div className="mt-3 flex gap-2">
              {goalOptions.map((g) => <button key={g} onClick={() => updatePreference('dailyGoalMinutes', g)} aria-pressed={dailyGoalMinutes === g} className={`flex-1 rounded-xl py-3 text-xs font-semibold transition-all active:scale-95 ${dailyGoalMinutes === g ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`}>
                  {g}m
                </button>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7 lg:mt-0">
        <div className="mb-3 px-1">
          <h2 className="text-sm font-semibold text-white">Notifications</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Only the nudges you want</p>
        </div>
        <div className="glass divide-y divide-white/[0.06] overflow-hidden rounded-[24px]">
          <SettingRow icon={BellIcon} title="Session reminders" description="At 4 PM local time if you haven't focused today." control={<ToggleSwitch label="Session reminders" checked={preferences.sessionReminders} onChange={(v) => handleReminderToggle('sessionReminders', v)} />} />
          <SettingRow icon={ListChecksIcon} title="Task reminders" description="At 4 PM local time for overdue or due-today tasks." control={<ToggleSwitch label="Task reminders" checked={preferences.taskReminders} onChange={(v) => handleReminderToggle('taskReminders', v)} />} />
          <SettingRow icon={MailIcon} title="Daily summary" description="At 6 PM local time when you have focus sessions today." control={<ToggleSwitch label="Daily summary" checked={preferences.dailySummary} onChange={(v) => handleReminderToggle('dailySummary', v)} />} />
        </div>
        {!isGuest && pushSupported() && !allRemindersOff && (
          <button
            onClick={() => void handleEnableDeviceNotifications()}
            className="mt-2.5 w-full rounded-2xl border border-ember-500/30 bg-ember-500/10 px-4 py-3 text-left text-xs text-ember-200 transition-all active:scale-[0.99]">
            <span className="font-semibold text-ember-300">
              {Notification.permission === 'granted' ? 'Sync notifications for this device' : 'Turn on notifications for this device'}
            </span>
            <span className="mt-0.5 block text-ember-200/70">
              {Notification.permission === 'granted'
                ? 'Re-register this device so scheduled reminders can reach it.'
                : 'Reminders only arrive when notifications are allowed and Cadence is installed.'}
            </span>
          </button>
        )}
      </section>

      <section className="mt-7 lg:mt-0">
        <div className="mb-3 px-1">
          <h2 className="text-sm font-semibold text-white">Focus shield</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Keep distractions out of the way</p>
        </div>
        <div className="glass divide-y divide-white/[0.06] overflow-hidden rounded-[24px]">
          <SettingRow icon={ShieldCheckIcon} title="Stay off distractions" description="Nudge me if I switch away during a session." control={<ToggleSwitch label="Stay off distractions" checked={preferences.blockDuringFocus} onChange={(v) => updatePreference('blockDuringFocus', v)} />} />
          <SettingRow icon={CalendarClockIcon} title="Distraction plan" description={profile.plan === 'pro' ? 'Plan by schedule, per-app, per-website' : 'Plan what to avoid during focus'} onClick={() => navigate('/app/blocking')} />
          <SettingRow icon={LockIcon} title="Strict mode" description="Sessions can't be ended early." control={<ToggleSwitch label="Strict mode" checked={preferences.strictMode} onChange={(v) => updatePreference('strictMode', v)} />} />
        </div>
      </section>

      <section className="mt-7 lg:mt-0">
        <div className="mb-3 px-1">
          <h2 className="text-sm font-semibold text-white">Account</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Your details and Cadence membership</p>
        </div>
        <div className="glass divide-y divide-white/[0.06] overflow-hidden rounded-[24px]">
          <SettingRow icon={UserRoundIcon} title="Edit profile" description="Update your name, school, email and photo." onClick={() => setEditing(true)} />
          <SettingRow icon={CreditCardIcon} title="Manage subscription" description={profile.plan === 'pro' ? `Cadence Pro · member since ${profile.memberSince}` : 'Unlock Cadence Pro for soundscapes and distraction planning'} onClick={() => navigate('/?paywall=1')} />
          <SettingRow icon={BoxIcon} title="Help & support" onClick={notifySupport} />
          <SettingRow icon={LogOutIcon} title={isGuest ? 'Leave guest mode' : 'Sign out'} onClick={handleSignOut} danger />
        </div>
      </section>

      <p className="mt-6 flex items-center justify-center gap-3 text-center text-[11px] text-neutral-600 lg:col-span-2 lg:mt-0">
        <button onClick={() => navigate('/privacy')} className="hit-slop transition-colors hover:text-neutral-400">Privacy</button>
        <span className="text-neutral-700">·</span>
        <button onClick={() => navigate('/terms')} className="hit-slop transition-colors hover:text-neutral-400">Terms</button>
      </p>
      <p className="mt-2 text-center text-[11px] text-neutral-600 lg:col-span-2 lg:mt-0">Cadence v1.0 · Made for focused students</p>
      {editing && <EditProfileSheet profile={profile} onClose={() => setEditing(false)} />}
    </div>;
}