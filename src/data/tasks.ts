import { addDays, format } from 'date-fns';
import { Task } from '../types/task';

const today = new Date();
const iso = (d: Date) => format(d, 'yyyy-MM-dd');

export const tasks: Task[] = [
{
  id: 't1',
  title: 'Read Chapter 7 – Cell Respiration',
  subject: 'Biology',
  estimatedPomodoros: 3,
  completedPomodoros: 1,
  dueDate: iso(today),
  completed: false
},
{
  id: 't2',
  title: 'Problem Set 4',
  subject: 'Calculus II',
  estimatedPomodoros: 2,
  completedPomodoros: 2,
  dueDate: iso(today),
  completed: true
},
{
  id: 't3',
  title: 'Outline History Essay',
  subject: 'World History',
  estimatedPomodoros: 2,
  completedPomodoros: 0,
  dueDate: iso(today),
  completed: false
},
{
  id: 't4',
  title: 'Vocabulary Review – Unit 5',
  subject: 'Spanish',
  estimatedPomodoros: 1,
  completedPomodoros: 0,
  dueDate: iso(addDays(today, 1)),
  completed: false
},
{
  id: 't5',
  title: 'Lab Report Draft',
  subject: 'Chemistry',
  estimatedPomodoros: 4,
  completedPomodoros: 0,
  dueDate: iso(addDays(today, 1)),
  completed: false
},
{
  id: 't6',
  title: 'Study for Midterm',
  subject: 'Calculus II',
  estimatedPomodoros: 5,
  completedPomodoros: 0,
  dueDate: iso(addDays(today, 3)),
  completed: false
},
{
  id: 't7',
  title: 'Group Project Slides',
  subject: 'Marketing',
  estimatedPomodoros: 2,
  completedPomodoros: 0,
  dueDate: iso(addDays(today, 4)),
  completed: false
}];