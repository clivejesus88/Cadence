
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon, FlameIcon, ClockIcon, ListChecksIcon, TimerIcon, CoffeeIcon, PlayIcon, BellIcon, MailIcon, ShieldCheckIcon, LockIcon, CreditCardIcon, LogOutIcon, BoxIcon } from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import { useSettings } from "../contexts/SettingsContext";
import { formatMinutes } from "../utils/time";
import { SettingRow } from "../components/profile/SettingRow";
import { ToggleSwitch } from "../components/profile/ToggleSwitch";
const durationOptions = [15, 25, 50, 90];
const breakOptions = [5, 10, 15];
export function Profile() {
  const navigate = useNavigate();
  const {
    currentStreak,
    totalSessionsCompleted,
    sessions
  } = useAppData();
  const {
    profile,
    preferences,
    updatePreference
  } = useSettings();
  const totalMinutes = sessions.filter((s) => s.type === 'focus' && s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
  return <div className="px-5 pt-8 pb-8">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate('/app/home')} aria-label="Back to dashboard" className="glass-inset flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl text-white">Profile</h1>
      </header>

      <section className="glass-strong mt-6 rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <img src={profile.avatarUrl} alt={profile.name} className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-white/20" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-semibold text-white">{profile.name}</p>
              {profile.plan === 'pro' && <span className="rounded-full bg-ember-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ember-400">
                  Pro
                </span>}
            </div>
            <p className="truncate text-xs text-neutral-400">{profile.school}</p>
            <p className="truncate text-xs text-neutral-500">{profile.email}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="glass-inset rounded-2xl px-3 py-3 text-center">
            <FlameIcon className="mx-auto h-4 w-4 text-ember-400" />
            <p className="mt-1.5 text-sm font-semibold text-white">{currentStreak}</p>
            <p className="text-[10px] text-neutral-500">Day streak</p>
          </div>
          <div className="glass-inset rounded-2xl px-3 py-3 text-center">
            <ClockIcon className="mx-auto h-4 w-4 text-neutral-300" />
            <p className="mt-1.5 text-sm font-semibold text-white">{formatMinutes(totalMinutes)}</p>
            <p className="text-[10px] text-neutral-500">Focused</p>
          </div>
          <div className="glass-inset rounded-2xl px-3 py-3 text-center">
            <ListChecksIcon className="mx-auto h-4 w-4 text-neutral-300" />
            <p className="mt-1.5 text-sm font-semibold text-white">{totalSessionsCompleted}</p>
            <p className="text-[10px] text-neutral-500">Sessions</p>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Focus preferences</h2>
        <div className="glass divide-y divide-white/5 overflow-hidden rounded-2xl">
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                <TimerIcon className="h-4 w-4 text-neutral-300" />
              </div>
              <p className="flex-1 text-sm font-medium text-white">Default session</p>
            </div>
            <div className="mt-3 flex gap-2">
              {durationOptions.map((d) => <button key={d} onClick={() => updatePreference('defaultDuration', d)} className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${preferences.defaultDuration === d ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`}>
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
              {breakOptions.map((b) => <button key={b} onClick={() => updatePreference('breakLength', b)} className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${preferences.breakLength === b ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`}>
                  {b}m
                </button>)}
            </div>
          </div>

          <SettingRow icon={PlayIcon} title="Auto-start breaks" description="Roll straight into a break when a session ends." control={<ToggleSwitch label="Auto-start breaks" checked={preferences.autoStartBreaks} onChange={(v) => updatePreference('autoStartBreaks', v)} />} />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Notifications</h2>
        <div className="glass divide-y divide-white/5 overflow-hidden rounded-2xl">
          <SettingRow icon={BellIcon} title="Session reminders" description="Nudge me when it's time to study." control={<ToggleSwitch label="Session reminders" checked={preferences.sessionReminders} onChange={(v) => updatePreference('sessionReminders', v)} />} />
          <SettingRow icon={MailIcon} title="Daily summary" description="A recap of your focus time each evening." control={<ToggleSwitch label="Daily summary" checked={preferences.dailySummary} onChange={(v) => updatePreference('dailySummary', v)} />} />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Focus shield</h2>
        <div className="glass divide-y divide-white/5 overflow-hidden rounded-2xl">
          <SettingRow icon={ShieldCheckIcon} title="Block during focus" description="Mute distracting apps while a session runs." control={<ToggleSwitch label="Block during focus" checked={preferences.blockDuringFocus} onChange={(v) => updatePreference('blockDuringFocus', v)} />} />
          <SettingRow icon={LockIcon} title="Strict mode" description="Sessions can't be ended early." control={<ToggleSwitch label="Strict mode" checked={preferences.strictMode} onChange={(v) => updatePreference('strictMode', v)} />} />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Account</h2>
        <div className="glass divide-y divide-white/5 overflow-hidden rounded-2xl">
          <SettingRow icon={CreditCardIcon} title="Manage subscription" description={`Cadence Pro · member since ${profile.memberSince}`} onClick={() => navigate('/')} />
          <SettingRow icon={BoxIcon} title="Help & support" onClick={() => navigate('/app/home')} />
          <SettingRow icon={LogOutIcon} title="Sign out" onClick={() => navigate('/')} danger />
        </div>
      </section>

      <p className="mt-6 text-center text-[11px] text-neutral-600">Cadence v1.0 · Made for focused students</p>
    </div>;
}