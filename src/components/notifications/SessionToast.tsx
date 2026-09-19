import type { LucideIcon } from "lucide-react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

interface SessionToastProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: 'ember' | 'success' | 'warning';
  id?: string | number;
}
const toneStyles: Record<string, string> = {
  ember: 'bg-ember-500/20 text-ember-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400'
};
export function SessionToast({
  icon: Icon,
  title,
  description,
  tone = 'ember',
  id
}: SessionToastProps) {
  const dismiss = () => {
    if (id !== undefined) toast.dismiss(id);
  };
  return <div className="glass-strong mx-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3.5">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-white">{title}</p>
        {description && <p className="mt-0.5 text-xs leading-4 text-neutral-400">{description}</p>}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
        <XIcon className="h-4 w-4" />
      </button>
    </div>;
}