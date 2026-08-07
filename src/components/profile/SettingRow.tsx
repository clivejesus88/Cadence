import React, { ReactNode } from "react";
import { ChevronRightIcon, BoxIcon } from "lucide-react";
interface SettingRowProps {
  icon: BoxIcon;
  title: string;
  description?: string;
  control?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}
export function SettingRow({
  icon: Icon,
  title,
  description,
  control,
  onClick,
  danger = false
}: SettingRowProps) {
  const content = <>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
        <Icon className={`h-4 w-4 ${danger ? 'text-red-400' : 'text-neutral-300'}`} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{title}</p>
        {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
      </div>
      {control ?? (onClick && <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-neutral-500" />)}
    </>;
  if (onClick) {
    return <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]">
        {content}
      </button>;
  }
  return <div className="flex w-full items-center gap-3 px-4 py-3.5">{content}</div>;
}