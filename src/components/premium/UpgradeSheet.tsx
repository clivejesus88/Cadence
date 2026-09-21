import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, XIcon } from 'lucide-react';
import { FeatureKey, FEATURE_COPY } from '../../utils/premium';

interface UpgradeSheetProps {
  feature: FeatureKey | null;
  onClose: () => void;
}

export function UpgradeSheet({ feature, onClose }: UpgradeSheetProps) {
  const navigate = useNavigate();
  const copy = feature ? FEATURE_COPY[feature] : null;

  return (
    <div className={`fixed inset-0 z-[60] flex items-end justify-center sm:items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {copy && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="glass-strong relative w-full max-w-sm rounded-[28px] p-6 text-center">
          <button
            onClick={onClose}
            aria-label="Close"
            className="glass-inset absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white">
            <XIcon className="h-4 w-4" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ember-500 to-orange-600 shadow-glow">
            <SparklesIcon className="h-7 w-7 text-white" />
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ember-400">Cadence Pro</p>
          <h2 className="font-display mt-1 text-2xl text-white">{copy.title}</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-neutral-400">{copy.desc}</p>

          <button
            onClick={() => {
              onClose();
              navigate('/?paywall=1');
            }}
            className="mt-7 w-full rounded-full bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]">
            Upgrade to Unlock
          </button>
          <button onClick={onClose} className="mt-3 text-xs text-neutral-500 transition-colors hover:text-neutral-300">
            Maybe later
          </button>
        </motion.div>
      )}
    </div>
  );
}