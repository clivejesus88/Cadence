import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { format } from 'date-fns';
import { Task } from '../types/task';
import { FocusSession } from '../types/session';
import { tasks as initialTasks } from '../data/tasks';
import { sessions as initialSessions } from '../data/sessions';
import { calculateCurrentStreak, todayFocusMinutes, weeklyFocusMinutes } from '../utils/streak';

interface AppDataContextValue {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completedPomodoros' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  sessions: FocusSession[];
  logSession: (durationMinutes: number, taskId?: string) => void;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  currentStreak: number;
  todayMinutes: number;
  weeklyData: {day: string;minutes: number;}[];
  totalSessionsCompleted: number;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: {children: ReactNode;}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sessions, setSessions] = useState<FocusSession[]>(initialSessions);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const addTask = (task: Omit<Task, 'id' | 'completedPomodoros' | 'completed'>) => {
    setTasks((prev) => [...prev, { ...task, id: `t${Date.now()}`, completedPomodoros: 0, completed: false }]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const logSession = (durationMinutes: number, taskId?: string) => {
    const newSession: FocusSession = {
      id: `s${Date.now()}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      durationMinutes,
      type: 'focus',
      completed: true,
      taskId
    };
    setSessions((prev) => [...prev, newSession]);
    if (taskId) {
      setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t)
      );
    }
  };

  const currentStreak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const todayMinutes = useMemo(() => todayFocusMinutes(sessions), [sessions]);
  const weeklyData = useMemo(() => weeklyFocusMinutes(sessions), [sessions]);
  const totalSessionsCompleted = useMemo(
    () => sessions.filter((s) => s.type === 'focus' && s.completed).length,
    [sessions]
  );

  const value: AppDataContextValue = {
    tasks,
    addTask,
    toggleTask,
    sessions,
    logSession,
    activeTaskId,
    setActiveTaskId,
    currentStreak,
    todayMinutes,
    weeklyData,
    totalSessionsCompleted
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}