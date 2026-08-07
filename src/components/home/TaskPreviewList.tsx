import { Text, View } from 'react-native';
import { CircleIcon } from 'lucide-react-native';
import { Task } from '../../types/task';
import { Glass } from '../ui/Glass';

interface TaskPreviewListProps {
  tasks: Task[];
}

export function TaskPreviewList({ tasks }: TaskPreviewListProps) {
  if (tasks.length === 0) {
    return (
      <Glass className="rounded-2xl p-4 text-center">
        <Text className="text-center text-sm text-neutral-500">
          All caught up — nothing due today.
        </Text>
      </Glass>
    );
  }
  return (
    <View className="gap-2">
      {tasks.map((t) => (
        <Glass key={t.id} className="flex-row items-center gap-3 rounded-2xl px-4 py-3">
          <CircleIcon size={16} color="#737373" className="shrink-0" />
          <View className="min-w-0 flex-1">
            <Text className="text-sm text-white" numberOfLines={1}>
              {t.title}
            </Text>
            <Text className="text-xs text-neutral-500">
              {t.subject} · {t.completedPomodoros}/{t.estimatedPomodoros} sessions
            </Text>
          </View>
        </Glass>
      ))}
    </View>
  );
}
