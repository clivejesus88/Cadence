
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, RotateCcwIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { ambientSounds } from '../../data/ambientSounds';
import { useSettings } from '../../contexts/SettingsContext';
import { Task } from '../../types/task';
import { formatCountdown } from '../../utils/time';
import { isPro, FeatureKey } from '../../utils/premium';
import { DurationDial } from './DurationDial';
import { Equalizer, SoundPalette } from './SoundPalette';

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
  const [soundOpen, setSoundOpen] = useState(false);
  const selectedSound = ambientSounds.find((s) => s.id === soundId) ?? ambientSounds[0];
  const SelectedSoundIcon = selectedSound.icon;
  const selectedSoundLocked = selectedSound.premium && !pro;
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
            className="hit-slop flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white active:scale-90">
            
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      }

      <div className="mt-7 flex flex-col items-center">
        <DurationDial value={durationMinutes} onChange={onChangeDuration} />
        <p className="mt-3 text-xs text-neutral-500">Drag the ring to set your time</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {presets.map((p) =>
          <button
            key={p}
            onClick={() => onChangeDuration(p)}
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 ${
            durationMinutes === p ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
            }>
            
              {p}m
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full mt-8 py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-ember-400 to-ember-600 text-ink-950 active:scale-[0.98] transition-transform">
        
        {resumeSeconds > 0 ? 'Resume Session' : 'Start Focusing'}
      </button>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setSoundOpen((v) => !v)}
          aria-expanded={soundOpen}
          className="glass-strong flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-transform active:scale-[0.99]">
          
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(140deg, ${selectedSound.accent}, ${selectedSound.accent}66)` }}>
            
            <SelectedSoundIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">{selectedSound.name}</p>
              {selectedSound.premium &&
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ember-300">
                  Pro
                </span>
              }
            </div>
            <p className="mt-0.5 truncate text-xs text-neutral-400">Focus Sound</p>
          </div>
          <span className="flex-shrink-0" style={{ color: selectedSound.accent }}>
            <Equalizer active={!selectedSoundLocked} />
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform ${soundOpen ? 'rotate-180' : ''}`} />
          
        </button>

        <AnimatePresence initial={false}>
          {soundOpen &&
          <motion.div
            key="sound-palette"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden">
            
              <SoundPalette soundId={soundId} onChangeSound={onChangeSound} onUpgrade={onUpgrade} pro={pro} hideHeader />
            </motion.div>
          }
        </AnimatePresence>
      </div>

      <div className="mt-6">
        <button
          onClick={() => onToggleBlocking(!blockingEnabled)}
          role="switch"
          aria-checked={blockingEnabled}
          className="glass w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-transform active:scale-[0.99]">
          
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className={`w-5 h-5 ${blockingEnabled ? 'text-ember-400' : 'text-neutral-500'}`} />
            <div className="text-left">
              <p className="text-sm text-white font-medium">Stay off distractions</p>
              <p className="text-xs text-neutral-400">
                {blockingEnabled
                  ? `Nudges you if you leave during focus`
                  : 'No reminders if you switch away'}
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
      </div>
    </div>);
}