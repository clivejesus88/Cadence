
import { motion } from 'framer-motion';
import { CheckCircle2Icon } from 'lucide-react';
import { formatMinutes } from '../../utils/time';

interface SessionCompleteProps {
  minutes: number;
  breakMinutes: number;
  onBreak: () => void;
  onDone: () => void;
}

export function SessionComplete({ minutes, breakMinutes, onBreak, onDone }: SessionCompleteProps) {
  return (
    <div className="px-5 pt-16 pb-8 flex flex-col items-center text-center min-h-[calc(100vh-6rem)]">
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

      <div className="w-full mt-10 space-y-3">
        <button
          onClick={onBreak}
          className="w-full py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-ember-400 to-ember-600 text-ink-950 shadow-glow active:scale-[0.98] transition-transform">
          
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