export interface Task {
  id: string;
  title: string;
  subject: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  dueDate: string; // ISO date, yyyy-MM-dd
  completed: boolean;
}