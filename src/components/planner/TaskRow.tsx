import { Pressable, Text, View } from 'react-native';
import { CheckIcon, PlayIcon } from 'lucide-react-native';
import { Task } from '../../types/task';
import { Glass } from '../ui/Glass';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onStartFocus: () => void;
}

export function TaskRow({ task, onToggle, onStartFocus }: TaskRowProps) {
  return (
    <Glass className="flex-row items-center gap-3 rounded-2xl px-4 py-3">
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          task.completed ? 'border-ember-500 bg-ember-500' : 'border-neutral-500'
        }`}>
        {task.completed && <CheckIcon size={12} color="#0a0d10" />}
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className={`text-sm ${task.completed ? 'text-neutral-500 line-through' : 'text-white'}`}>
          {task.title}
        </Text>
        <Text className="text-xs text-neutral-500">
          {task.subject} · {task.completedPomodoros}/{task.estimatedPomodoros} sessions
        </Text>
      </View>
      {!task.completed && (
        <Pressable
          onPress={onStartFocus}
          accessibilityLabel="Start focus session"
          className="h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <PlayIcon size={14} color="#fb923c" />
        </Pressable>
      )}
    </Glass>
  );
}
