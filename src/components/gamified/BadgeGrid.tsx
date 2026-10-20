import { LockIcon } from 'lucide-react';
import { BadgeStatus } from '../../utils/gamification';

interface BadgeGridProps {
  badges: BadgeStatus[];
  className?: string;
}

export function BadgeGrid({ badges, className = '' }: BadgeGridProps) {
  return (
    <div className={`-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 no-scrollbar ${className}`}>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            className={`flex w-[84px] flex-shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-3.5 text-center ${
              badge.earned ? 'glass' : 'glass-inset opacity-60'
            }`}>
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                badge.earned ? 'bg-white/10 text-white' : 'bg-white/[0.05] text-neutral-500'
              }`}>
              {badge.earned ? <Icon className="h-5 w-5" /> : <LockIcon className="h-4 w-4" />}
            </span>
            <span className={`text-[11px] font-semibold leading-tight ${badge.earned ? 'text-white' : 'text-neutral-500'}`}>
              {badge.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
