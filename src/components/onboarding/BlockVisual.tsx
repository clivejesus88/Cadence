
import { LockIcon, BellOffIcon } from 'lucide-react';

export function BlockVisual() {
  return (
    <div className="relative w-full max-w-[260px]">
      <div className="glass-strong rounded-3xl p-5">
        <div className="flex items-center justify-between text-neutral-500 text-xs mb-4">
          <span>9:41</span>
          <LockIcon className="w-3.5 h-3.5" />
        </div>
        <div className="glass-inset flex items-start gap-3 rounded-2xl p-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ backgroundColor: '#E1306C' }}>
            
            IG
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Instagram — Blocked</p>
            <p className="text-xs text-neutral-400 mt-0.5">Stay focused. Reopens after your session.</p>
          </div>
          <BellOffIcon className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
        </div>
      </div>
    </div>);

}