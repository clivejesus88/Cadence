import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { useAppData } from '../contexts/AppDataContext';
import { TaskRow } from '../components/planner/TaskRow';
import { AddTaskSheet } from '../components/planner/AddTaskSheet';

export function Planner() {
  const { tasks, toggleTask, setActiveTaskId } = useAppData();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  const groups = useMemo(() => {
    const todayTasks = tasks.filter((t) => isToday(parseISO(t.dueDate)));
    const tomorrowTasks = tasks.filter((t) => isTomorrow(parseISO(t.dueDate)));
    const laterTasks = tasks.filter((t) => !isToday(parseISO(t.dueDate)) && !isTomorrow(parseISO(t.dueDate)));
    return [
    { label: 'Today', items: todayTasks },
    { label: 'Tomorrow', items: tomorrowTasks },
    { label: 'Later', items: laterTasks }].
    filter((g) => g.items.length > 0);
  }, [tasks]);

  const completedToday = tasks.filter((t) => isToday(parseISO(t.dueDate)) && t.completed).length;
  const totalToday = tasks.filter((t) => isToday(parseISO(t.dueDate))).length;

  const startFocusOn = (taskId: string) => {
    setActiveTaskId(taskId);
    navigate('/app/focus');
  };

  return (
    <div className="px-5 pt-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Planner</h1>
          <p className="text-neutral-400 text-sm mt-1">
            {completedToday}/{totalToday} done today
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          aria-label="Add task"
          className="w-10 h-10 rounded-full bg-ember-500 flex items-center justify-center text-ink-950">
          
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((g) =>
        <div key={g.label}>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2.5">{g.label}</p>
            <div className="space-y-2">
              {g.items.map((t) =>
            <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onStartFocus={() => startFocusOn(t.id)} />
            )}
            </div>
          </div>
        )}
        {groups.length === 0 && <div className="text-center text-sm text-neutral-500 py-10">No tasks yet. Add your first one.</div>}
      </div>

      {showAdd && <AddTaskSheet onClose={() => setShowAdd(false)} />}
    </div>);

}