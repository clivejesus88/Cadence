import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { addTask, toggleTask, logSession } from '../db/repo';
import { scheduleSync } from '../db/sync';
import { useAuth } from './AuthContext';
import { Task } from '../types/task';
import { FocusSession } from '../types/session';
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
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const tasks = useLiveQuery(
    () =>
      uid === null
        ? db.tasks.filter((r) => r.userId === null && !r.deleted).toArray()
        : db.tasks.where('userId').equals(uid).and((r) => !r.deleted).toArray(),
    [uid],
    []
  );

  const sessions = useLiveQuery(
    () =>
      uid === null
        ? db.focusSessions.filter((r) => r.userId === null && !r.deleted).toArray()
        : db.focusSessions.where('userId').equals(uid).and((r) => !r.deleted).toArray(),
    [uid],
    []
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const handleAddTask = (task: Omit<Task, 'id' | 'completedPomodoros' | 'completed'>) => {
    void addTask(task).then(() => scheduleSync());
  };

  const handleToggleTask = (id: string) => {
    void toggleTask(id).then(() => scheduleSync());
  };

  const handleLogSession = (durationMinutes: number, taskId?: string) => {
    void logSession(durationMinutes, taskId).then(() => scheduleSync());
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
    addTask: handleAddTask,
    toggleTask: handleToggleTask,
    sessions,
    logSession: handleLogSession,
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