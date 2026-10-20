
import { motion } from 'framer-motion';
import { CheckCircle2Icon, ZapIcon } from 'lucide-react';
import { formatMinutes } from '../../utils/time';
import { XpBar } from '../gamified/XpBar';
import { useAppData } from '../../contexts/AppDataContext';

interface SessionCompleteProps {
  minutes: number;
  breakMinutes: number;
  onBreak: () => void;
  onDone: () => void;
}

export function SessionComplete({ minutes, breakMinutes, onBreak, onDone }: SessionCompleteProps) {
  const { level } = useAppData();
  const xpGained = minutes + 5;
  return (
    <div className="px-5 pt-16 pb-8 flex flex-col items-center text-center min-h-[calc(100dvh-8rem)]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
        
        <div className="w-20 h-20 rounded-full bg-ember-500/15 flex items-center justify-center">
          <CheckCircle2Icon className="w-10 h-10 text-ember-400" />
        </div>
      </motion.div>
      <p className="font-display text-2xl text-white mt-6">Nice work!</p>
      <p className="text-neutral-400 text-sm mt-1.5">You focused for {formatMinutes(minutes)}. Keep the streak going.</p>

      <motion.div
        className="glass-strong mt-6 w-full rounded-2xl px-5 py-4 text-left"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ember-400">
            <ZapIcon className="h-3.5 w-3.5" /> XP earned
          </span>
          <span className="font-display text-xl text-white tabular-nums">+{xpGained}</span>
        </div>
        <XpBar progress={level.progress} className="mt-3" />
        <p className="mt-2 text-xs text-neutral-400 tabular-nums">
          Level {level.level} · {level.title} · {level.xpIntoLevel}/{level.xpForLevel} XP
        </p>
      </motion.div>

      <div className="w-full mt-8 space-y-3">
        <button
          onClick={onBreak}
          className="w-full py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-ember-400 to-ember-600 text-ink-950 active:scale-[0.98] transition-transform">
          
          Take a {breakMinutes}-min break
        </button>
        <button
          onClick={onDone}
          className="glass w-full py-4 rounded-full font-semibold text-[15px] text-white active:scale-[0.98] transition-transform">
          
          Done
        </button>
      </div>
    </div>);

}
