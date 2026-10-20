import type { LucideIcon } from "lucide-react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

export type ToastTone = 'ember' | 'success' | 'warning' | 'info';

interface SessionToastProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: ToastTone;
  id?: string | number;
  /** Total lifetime in ms — drives the countdown bar. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

const toneStyles: Record<ToastTone, { ring: string; icon: string; glow: string; bar: string; accent: string }> = {
  ember: {
    ring: 'ring-ember-400/30',
    icon: 'from-ember-400/30 to-ember-600/10 text-ember-300',
    glow: 'rgba(251,146,60,0.35)',
    bar: 'bg-gradient-to-r from-ember-400 to-ember-600',
    accent: '#fb923c'
  },
  success: {
    ring: 'ring-emerald-400/30',
    icon: 'from-emerald-400/30 to-emerald-600/10 text-emerald-300',
    glow: 'rgba(52,211,153,0.32)',
    bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    accent: '#34d399'
  },
  warning: {
    ring: 'ring-amber-400/30',
    icon: 'from-amber-400/30 to-amber-600/10 text-amber-300',
    glow: 'rgba(251,191,36,0.32)',
    bar: 'bg-gradient-to-r from-amber-400 to-amber-600',
    accent: '#fbbf24'
  },
  info: {
    ring: 'ring-sky-400/30',
    icon: 'from-sky-400/30 to-sky-600/10 text-sky-300',
    glow: 'rgba(56,189,248,0.3)',
    bar: 'bg-gradient-to-r from-sky-400 to-sky-600',
    accent: '#38bdf8'
  }
};

export function SessionToast({
  icon: Icon,
  title,
  description,
  tone = 'ember',
  id,
  duration = 3000,
  action
}: SessionToastProps) {
  const t = toneStyles[tone];
  const dismiss = () => {
    if (id !== undefined) toast.dismiss(id);
  };
  return (
    <div
      role="status"
      className="toast-card mx-auto flex w-full max-w-sm items-start gap-3.5 overflow-hidden rounded-[22px] px-4 py-3.5"
      style={{ '--toast-glow': t.glow } as React.CSSProperties}>
      <span
        className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full blur-3xl"
        style={{ background: t.glow, opacity: 0.5 }}
      />
      <div
        className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ring-1 ${t.icon} ${t.ring}`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="relative min-w-0 flex-1 pt-0.5">
        <p className="text-[13px] font-semibold leading-5 text-white">{title}</p>
        {description && <p className="mt-0.5 text-xs leading-4 text-neutral-400">{description}</p>}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              dismiss();
            }}
            className="mt-2 rounded-full px-3 py-1 text-[11px] font-bold text-ink-950 transition-transform active:scale-95"
            style={{ background: t.accent }}>
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="hit-slop relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white active:scale-90">
        <XIcon className="h-4 w-4" />
      </button>
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-[2px] origin-left ${t.bar}`}
        style={{ animation: `toast-countdown ${duration}ms linear forwards` }}
      />
    </div>
  );
}
