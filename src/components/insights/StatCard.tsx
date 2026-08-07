import { Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Glass } from '../ui/Glass';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Glass className="rounded-2xl p-4">
      <Icon size={16} color="#fb923c" />
      <Text className="mt-2 text-lg font-semibold text-white">{value}</Text>
      <Text className="mt-0.5 text-xs text-neutral-400">{label}</Text>
    </Glass>
  );
}
