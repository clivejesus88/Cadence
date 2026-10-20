import { CrownIcon } from 'lucide-react';
import { LevelInfo } from '../../utils/gamification';

interface LevelBadgeProps {
  level: LevelInfo;
  className?: string;
  showTitle?: boolean;
}

export function LevelBadge({ level, className = '', showTitle = true }: LevelBadgeProps) {
  return (
    <span
      className={`glass-pill inline-flex items-center gap-1.5 rounded-full pl-2 pr-3 py-1 ${className}`}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-ember-400 to-ember-600 text-ink-950">
        <CrownIcon className="h-3 w-3" />
      </span>
      <span className="text-xs font-bold text-white">
        {showTitle ? `${level.title}` : `Lv ${level.level}`}
      </span>
      <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">{level.level}</span>
    </span>
  );
}
