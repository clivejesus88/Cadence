import { ShieldCheckIcon, PlayIcon, SquareIcon } from 'lucide-react';

interface FocusShieldProps {
  visible: boolean;
  taskTitle?: string;
  onContinue: () => void;
  onEndSession: () => void;
}

export function FocusShield({ visible, taskTitle, onContinue, onEndSession }: FocusShieldProps) {
  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-6 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Focus shield active">
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur-xl" />
      <div className="glass-strong relative w-full max-w-sm rounded-[28px] p-7 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ember-500/15">
          <ShieldCheckIcon className="h-8 w-8 text-ember-400" />
        </div>
        <h2 className="font-display mt-5 text-2xl text-white">Focus shield</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          You switched away from Cadence while blocking was on. What you're doing here is up to you
          {taskTitle ? <> — your <span className="text-white">{taskTitle}</span> timer is still running.</> : ' — your timer is still running.'}
        </p>
        <div className="mt-7 space-y-3">
          <button
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-ember-400 to-ember-600 py-4 text-[15px] font-bold text-ink-950 transition-transform active:scale-[0.98]">
            <PlayIcon className="h-5 w-5" />
            Keep this session
          </button>
          <button
            onClick={onEndSession}
            className="glass flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold text-white transition-transform active:scale-[0.98]">
            <SquareIcon className="h-4 w-4" />
            End session
          </button>
        </div>
      </div>
    </div>
  );
}