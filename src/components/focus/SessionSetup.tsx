
import { LockIcon, RotateCcwIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { ambientSounds } from '../../data/ambientSounds';
import { blockedApps } from '../../data/blockedApps';
import { useSettings } from '../../contexts/SettingsContext';
import { Task } from '../../types/task';
import { formatCountdown } from '../../utils/time';
import { isPro, FeatureKey } from '../../utils/premium';
import { DurationDial } from './DurationDial';

interface SessionSetupProps {
  durationMinutes: number;
  onChangeDuration: (m: number) => void;
  soundId: string;
  onChangeSound: (id: string) => void;
  blockingEnabled: boolean;
  onToggleBlocking: (v: boolean) => void;
  activeTask?: Task;
  resumeSeconds: number;
  onDiscardResume: () => void;
  onStart: () => void;
  onUpgrade?: (feature: FeatureKey) => void;
}

const presets = [15, 25, 50, 90, 180];

export function SessionSetup({
  durationMinutes,
  onChangeDuration,
  soundId,
  onChangeSound,
  blockingEnabled,
  onToggleBlocking,
  activeTask,
  resumeSeconds,
  onDiscardResume,
  onStart,
  onUpgrade
}: SessionSetupProps) {
  const { profile } = useSettings();
  const pro = isPro(profile);
  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl text-white">Focus Session</h1>
      <p className="text-neutral-400 text-sm mt-1">Set up your session, then dive in.</p>

      {activeTask &&
      <div className="glass mt-5 flex items-center gap-3 rounded-2xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-ember-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{activeTask.title}</p>
            <p className="text-xs text-neutral-400">{activeTask.subject}</p>
          </div>
        </div>
      }

      {resumeSeconds > 0 &&
      <div className="glass mt-5 flex items-center gap-3 rounded-2xl px-4 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ember-500/20">
            <RotateCcwIcon className="h-4 w-4 text-ember-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">Resume where you left off</p>
            <p className="mt-0.5 text-xs text-neutral-400">{formatCountdown(resumeSeconds)} focused so far</p>
          </div>
          <button
            onClick={onDiscardResume}
            aria-label="Discard session progress"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
            
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      }

      <div className="mt-7 flex flex-col items-center">
        <DurationDial value={durationMinutes} onChange={onChangeDuration} />
        <p className="mt-3 text-xs text-neutral-500">Drag the ring to set your time</p>
        <div className="mt-4 flex gap-2">
          {presets.map((p) =>
          <button
            key={p}
            onClick={() => onChangeDuration(p)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            durationMinutes === p ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
            }>
            
              {p}m
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-white font-semibold text-sm mb-3">Focus Sound</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {ambientSounds.map((s) => {
            const Icon = s.icon;
            const selected = !s.premium && soundId === s.id;
            const locked = s.premium && !pro;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (locked) {
                    onUpgrade?.('premiumSounds');
                    return;
                  }
                  onChangeSound(s.id);
                }}
                className={`relative flex-shrink-0 w-24 rounded-2xl p-3 text-left transition-colors ${
                selected ? 'bg-ember-500/15 border border-ember-400' : 'glass-inset'}`
                }>
                
                <Icon className={`w-5 h-5 ${selected ? 'text-ember-400' : locked ? 'text-neutral-600' : 'text-neutral-400'}`} />
                <p className={`text-xs font-medium mt-2 ${selected ? 'text-white' : locked ? 'text-neutral-500' : 'text-neutral-300'}`}>{s.name}</p>
                {locked &&
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                    <LockIcon className="h-3 w-3 text-neutral-400" />
                  </span>
                }
              </button>);

          })}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => onToggleBlocking(!blockingEnabled)}
          className="glass w-full flex items-center justify-between rounded-2xl px-4 py-3.5">
          
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className={`w-5 h-5 ${blockingEnabled ? 'text-ember-400' : 'text-neutral-500'}`} />
            <div className="text-left">
              <p className="text-sm text-white font-medium">Block Distractions</p>
              <p className="text-xs text-neutral-400">
                {blockedApps.filter((a) => a.blockedByDefault).length} apps muted during focus
              </p>
            </div>
          </div>
          <div
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
            blockingEnabled ? 'bg-ember-500 justify-end' : 'bg-white/10 justify-start'}`
            }>
            
            <div className="w-5 h-5 rounded-full bg-white" />
          </div>
        </button>
        <button
          onClick={() => (pro ? onOpenRules?.() : onUpgrade?.('blockingRules'))}
          className="glass mt-2.5 w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/[0.03]">
          
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
              {pro ?
              <ShieldCheckIcon className="w-4 h-4 text-ember-400" /> :
              <LockIcon className="w-4 h-4 text-neutral-500" />
              }
            </div>
            <div>
              <p className="text-sm text-white font-medium">Advanced blocking rules</p>
              <p className="text-xs text-neutral-400">
                {pro ? 'Schedule, per-app, per-website' : 'Locked — upgrade to control what stays blocked'}
              </p>
            </div>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      <button
        onClick={onStart}
        className="w-full mt-8 py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-ember-400 to-ember-600 text-ink-950 shadow-glow active:scale-[0.98] transition-transform">
        
        {resumeSeconds > 0 ? 'Resume Session' : 'Start Focusing'}
      </button>
    </div>);

}