import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CrownIcon } from 'lucide-react';
import { LevelInfo } from '../../utils/gamification';

interface LevelUpCelebrationProps {
  level: LevelInfo | null;
  onDismiss: () => void;
}

export function LevelUpCelebration({ level, onDismiss }: LevelUpCelebrationProps) {
  useEffect(() => {
    if (!level) return;
    const t = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(t);
  }, [level, onDismiss]);

  return createPortal(
    <AnimatePresence>
      {level && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink-950/80 px-8 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          role="status"
          aria-live="polite">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-ember-400 to-ember-600 text-ink-950 shadow-[0_0_60px_rgba(251,146,60,0.55)]">
              <CrownIcon className="h-10 w-10" />
            </span>
          </motion.div>
          <motion.p
            className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-ember-400"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}>
            Level up
          </motion.p>
          <motion.p
            className="mt-2 font-display text-4xl text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>
            {level.title}
          </motion.p>
          <motion.p
            className="mt-2 text-sm text-neutral-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}>
            Level {level.level} reached — keep the momentum going.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
