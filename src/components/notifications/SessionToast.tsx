import type { LucideIcon } from "lucide-react";
interface SessionToastProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: 'ember' | 'success' | 'warning';
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
  tone = 'ember'
}: SessionToastProps) {
  return <div className="glass-strong mx-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3.5">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-white">{title}</p>
        {description && <p className="mt-0.5 text-xs leading-4 text-neutral-400">{description}</p>}
      </div>
    </div>;
}