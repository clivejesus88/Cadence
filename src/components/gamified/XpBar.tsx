import { motion } from 'framer-motion';

interface XpBarProps {
  progress: number; // 0..1
  className?: string;
}

export function XpBar({ progress, className = '' }: XpBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-ember-400 via-ember-500 to-amber-400"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
    </div>
  );
}
