import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRightIcon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface SettingRowProps {
  icon: LucideIcon;
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
  danger = false,
}: SettingRowProps) {
  const content = (
    <>
      <View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
        <Icon size={16} color={danger ? '#f87171' : '#a3a3a3'} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>
          {title}
        </Text>
        {description && <Text className="mt-0.5 text-xs text-neutral-500">{description}</Text>}
      </View>
      {control ?? (onClick && <ChevronRightIcon size={16} color="#737373" className="shrink-0" />)}
    </>
  );

  if (onClick) {
    return (
      <Pressable onPress={onClick} className="w-full flex-row items-center gap-3 px-4 py-3.5">
        {content}
      </Pressable>
    );
  }
  return <View className="w-full flex-row items-center gap-3 px-4 py-3.5">{content}</View>;
}
