import { LockIcon } from 'lucide-react';
import { BadgeStatus } from '../../utils/gamification';

interface BadgeGridProps {
  badges: BadgeStatus[];
  className?: string;
}

export function BadgeGrid({ badges, className = '' }: BadgeGridProps) {
  return (
    <div className={`grid grid-cols-3 gap-2.5 ${className}`}>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5 text-center transition-colors ${
              badge.earned ? 'glass' : 'glass-inset opacity-60'
            }`}>
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                badge.earned
                  ? 'bg-gradient-to-br from-ember-400 to-ember-600 text-ink-950'
                  : 'bg-white/[0.06] text-neutral-500'
              }`}>
              {badge.earned ? <Icon className="h-5 w-5" /> : <LockIcon className="h-4 w-4" />}
            </span>
            <span className={`text-[11px] font-semibold leading-tight ${badge.earned ? 'text-white' : 'text-neutral-500'}`}>
              {badge.name}
            </span>
            <span className="text-[10px] font-medium tabular-nums text-neutral-500">
              {badge.progressLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
