import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { useAppData } from '../contexts/AppDataContext';
import { TaskRow } from '../components/planner/TaskRow';
import { AddTaskSheet } from '../components/planner/AddTaskSheet';
import { Screen } from '../components/ui/Screen';

export function Planner() {
  const { tasks, toggleTask, setActiveTaskId } = useAppData();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  const groups = useMemo(() => {
    const todayTasks = tasks.filter((t) => isToday(parseISO(t.dueDate)));
    const tomorrowTasks = tasks.filter((t) => isTomorrow(parseISO(t.dueDate)));
    const laterTasks = tasks.filter(
      (t) => !isToday(parseISO(t.dueDate)) && !isTomorrow(parseISO(t.dueDate))
    );
    return [
      { label: 'Today', items: todayTasks },
      { label: 'Tomorrow', items: tomorrowTasks },
      { label: 'Later', items: laterTasks },
    ].filter((g) => g.items.length > 0);
  }, [tasks]);

  const completedToday = tasks.filter((t) => isToday(parseISO(t.dueDate)) && t.completed).length;
  const totalToday = tasks.filter((t) => isToday(parseISO(t.dueDate))).length;

  const startFocusOn = (taskId: string) => {
    setActiveTaskId(taskId);
    router.push('/focus');
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-display text-2xl text-white">Planner</Text>
          <Text className="mt-1 text-sm text-neutral-400">
            {completedToday}/{totalToday} done today
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAdd(true)}
          accessibilityLabel="Add task"
          className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <PlusIcon size={20} color="#fb923c" />
        </Pressable>
      </View>

      {groups.map((group) => (
        <View key={group.label} className="mt-6">
          <Text className="mb-3 text-sm font-semibold text-white">{group.label}</Text>
          <View className="gap-2">
            {group.items.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onStartFocus={() => startFocusOn(task.id)}
              />
            ))}
          </View>
        </View>
      ))}

      {showAdd && <AddTaskSheet onClose={() => setShowAdd(false)} />}
    </Screen>
  );
}
