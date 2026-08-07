import { Text, View } from 'react-native';
import { LockIcon, BellOffIcon } from 'lucide-react-native';
import { Glass } from '../ui/Glass';

export function BlockVisual() {
  return (
    <View className="w-full max-w-[260px]">
      <Glass variant="strong" className="rounded-3xl p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xs text-neutral-500">9:41</Text>
          <LockIcon size={14} color="#737373" />
        </View>
        <Glass variant="inset" className="rounded-2xl p-3">
          <View className="flex-row items-start gap-3">
            <View
              className="h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#E1306C' }}>
              <Text className="text-sm font-semibold text-white">IG</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-white">
                Instagram — Blocked
              </Text>
              <Text className="mt-0.5 text-xs text-neutral-400">
                Stay focused. Reopens after your session.
              </Text>
            </View>
            <BellOffIcon size={16} color="#737373" className="mt-0.5 shrink-0" />
          </View>
        </Glass>
      </Glass>
    </View>
  );
}
