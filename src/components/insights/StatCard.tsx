import type { LucideIcon } from "lucide-react";
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}
export function StatCard({
  icon: Icon,
  label,
  value
}: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.07]">
        <Icon className="h-4 w-4 text-ember-400" />
      </div>
      <p className="font-numeric mt-3 truncate text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 truncate text-xs text-neutral-400">{label}</p>
    </div>);
}
