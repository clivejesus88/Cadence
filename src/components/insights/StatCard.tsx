import React from "react";
import { BoxIcon } from "lucide-react";
interface StatCardProps {
  icon: BoxIcon;
  label: string;
  value: string;
}
export function StatCard({
  icon: Icon,
  label,
  value
}: StatCardProps) {
  return <div className="glass rounded-2xl p-4">
      <Icon className="w-4 h-4 text-ember-400" />
      <p className="text-lg font-semibold text-white mt-2">{value}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
    </div>;
}