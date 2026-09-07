
import { AnimatePresence, motion } from 'framer-motion';
import { PauseIcon, PlayIcon, SquareIcon, ShieldCheckIcon } from 'lucide-react';
import { CircularTimer } from '../CircularTimer';
import { TickRing } from './TickRing';
import { ambientSounds } from '../../data/ambientSounds';
import { formatCountdown } from '../../utils/time';
import { Task } from '../../types/task';

interface ActiveSessionProps {
  sessionType: 'focus' | 'break';
  elapsedSeconds: number;
  targetSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  soundId: string;
  blockingEnabled: boolean;
  activeTask?: Task;
}

export function ActiveSession({
  sessionType,
  elapsedSeconds,
  targetSeconds,
  isPaused,
  onTogglePause,
  onEnd,
  soundId,
  blockingEnabled,
  activeTask
}: ActiveSessionProps) {
  const isOvertime = sessionType === 'focus' && elapsedSeconds >= targetSeconds;
  const displaySeconds = isOvertime ? elapsedSeconds - targetSeconds : Math.max(0, targetSeconds - elapsedSeconds);
  const progress = targetSeconds > 0 ? Math.min(1, elapsedSeconds / targetSeconds) : 0;
  const sound = ambientSounds.find((s) => s.id === soundId) ?? ambientSounds[0];
  const SoundIcon = sound.icon;
  const isBreathing = sessionType === 'focus' && !isPaused;

  return (
    <div className="px-5 pt-10 pb-6 flex flex-col items-center min-h-[calc(100vh-6rem)]">
      <p className="text-neutral-400 text-sm uppercase tracking-wide font-medium">
        {sessionType === 'focus' ? 'Focusing' : 'Break'}
      </p>
      {activeTask && sessionType === 'focus' &&
      <p className="text-white text-sm mt-1 truncate max-w-[220px]">{activeTask.title}</p>
      }

      <div className="mt-8 relative">
        <div className={`absolute inset-6 rounded-full bg-ember-500/10 blur-2xl ${isOvertime ? 'bg-ember-500/20' : ''}`} />
        <motion.div
          className="relative"
          style={{ width: 240, height: 240 }}
          animate={isBreathing ? { scale: [1, 1.015, 1] } : { scale: 1 }}
          transition={isBreathing ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3, ease: 'easeOut' }}>
          
          <TickRing size={240} radius={95} progress={progress} tickCount={40} />
          <CircularTimer progress={progress} size={240} strokeWidth={12}>
            <div className="text-center">
              <p className="font-display text-5xl text-white tabular-nums">
                {isOvertime && <span className="text-ember-400">+</span>}
                {formatCountdown(displaySeconds)}
              </p>
              {isPaused ?
              <p className="text-xs text-ember-400 mt-1 font-medium">Paused</p> :
              isOvertime ?
              <p className="text-xs text-ember-400 mt-1 font-medium">Bonus focus time</p> :
              null}
            </div>
          </CircularTimer>
        </motion.div>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <button
          onClick={onEnd}
          aria-label="End session"
          className="glass w-12 h-12 rounded-full flex items-center justify-center text-neutral-300 hover:text-white transition-colors">
          
          <SquareIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onTogglePause}
          aria-label={isPaused ? 'Resume' : 'Pause'}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-ink-950 shadow-glow overflow-hidden">
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isPaused ? 'play' : 'pause'}
              initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex items-center justify-center">
              
              {isPaused ? <PlayIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
        <div className="w-12 h-12" />
      </div>

      {sessionType === 'focus' &&
      <div className="mt-10 w-full space-y-2.5">
          <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <SoundIcon className="w-4 h-4 text-ember-400 flex-shrink-0" />
            <p className="text-sm text-white flex-1">{sound.name}</p>
            <span className="text-xs text-neutral-400">Playing</span>
          </div>
          {blockingEnabled &&
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
              <ShieldCheckIcon className="w-4 h-4 text-ember-400 flex-shrink-0" />
              <p className="text-sm text-white flex-1">Distractions blocked</p>
              <span className="text-xs text-neutral-400">Active</span>
            </div>
        }
        </div>
      }
    </div>);

}