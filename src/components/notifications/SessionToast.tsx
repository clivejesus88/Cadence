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
  action?: { label: string; onClick: () => void };
}

const toneStyles: Record<ToastTone, string> = {
  ember: 'bg-ember-500/20 text-ember-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  info: 'bg-sky-500/20 text-sky-400'
};

export function SessionToast({
  icon: Icon,
  title,
  description,
  tone = 'ember',
  id,
  action
}: SessionToastProps) {
  const dismiss = () => {
    if (id !== undefined) toast.dismiss(id);
  };
  return <div className="toast-card mx-auto flex w-full max-w-sm items-start gap-3 rounded-[22px] px-4 py-3.5">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-white">{title}</p>
        {description && <p className="mt-0.5 text-xs leading-4 text-neutral-400">{description}</p>}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              dismiss();
            }}
            className="mt-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-ink-950 transition-transform active:scale-95">
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="hit-slop flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white active:scale-90">
        <XIcon className="h-4 w-4" />
      </button>
    </div>;
}
