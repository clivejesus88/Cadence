import type { LucideIcon } from "lucide-react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

export type ToastTone = 'ember' | 'success' | 'warning' | 'info';

interface SessionToastProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: ToastTone;
  assertive?: boolean;
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
  assertive = false,
  id,
  action
}: SessionToastProps) {
  const dismiss = () => {
    if (id !== undefined) toast.dismiss(id);
  };
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-tone={tone}
      className="toast-card mx-auto flex w-full max-w-[340px] items-center gap-2.5 rounded-[17px] px-2.5 py-2">
      <div
        aria-hidden="true"
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[11px] ${toneStyles[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-4 text-white">{title}</p>
        {description && <p className="toast-description mt-0.5 break-words text-[11px] leading-4 text-neutral-300/75">{description}</p>}
        {action && (
          <button
            type="button"
            onClick={() => {
              try {
                action.onClick();
              } finally {
                dismiss();
              }
            }}
            className="mt-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-white/[0.14] active:scale-95">
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={`Dismiss notification: ${title}`}
        className="hit-slop -mr-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-90">
        <XIcon aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
