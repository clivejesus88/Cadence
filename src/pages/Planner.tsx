import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { useAppData } from '../contexts/AppDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatMinutes } from '../utils/time';
import { TaskRow } from '../components/planner/TaskRow';
import { AddTaskSheet } from '../components/planner/AddTaskSheet';

export function Planner() {
  const { tasks, toggleTask, setActiveTaskId } = useAppData();
  const { preferences } = useSettings();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const { groups, completedTasks, completedToday, totalToday, remainingFocusMinutes } = useMemo(() => {
    const activeTasks = tasks.filter((task) => !task.completed);
    const isOverdue = (dueDate: string) => {
      const date = parseISO(dueDate);
      return isPast(date) && !isToday(date);
    };
    const overdueTasks = activeTasks.filter((task) => isOverdue(task.dueDate));
    const todayTasks = activeTasks.filter((task) => isToday(parseISO(task.dueDate)));
    const tomorrowTasks = activeTasks.filter((task) => isTomorrow(parseISO(task.dueDate)));
    const laterTasks = activeTasks.filter(
      (task) =>
        !isToday(parseISO(task.dueDate)) &&
        !isTomorrow(parseISO(task.dueDate)) &&
        !isOverdue(task.dueDate)
    );

    return {
      groups: [
        { label: 'Overdue', items: overdueTasks },
        { label: 'Today', items: todayTasks },
        { label: 'Tomorrow', items: tomorrowTasks },
        { label: 'Later', items: laterTasks }
      ].filter((group) => group.items.length > 0),
      completedTasks: tasks.filter((task) => task.completed),
      completedToday: tasks.filter((task) => isToday(parseISO(task.dueDate)) && task.completed).length,
      totalToday: tasks.filter((task) => isToday(parseISO(task.dueDate))).length,
      remainingFocusMinutes: todayTasks.reduce(
        (total, task) =>
          total + Math.max(0, task.estimatedPomodoros - task.completedPomodoros) * preferences.defaultDuration,
        0
      )
    };
  }, [tasks, preferences.defaultDuration]);

  const startFocusOn = (taskId: string) => {
    setActiveTaskId(taskId);
    navigate('/app/focus');
  };

  const todayProgress = totalToday > 0 ? completedToday / totalToday : 0;

  return (
    <div className="px-5 pt-8 pb-8 lg:px-8 lg:pt-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Planner</h1>
          <p className="mt-1 text-sm text-neutral-400">A clear plan for your next focus session.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/focus')}
            aria-label="Start a focus session"
            className="glass-inset flex h-11 w-11 items-center justify-center rounded-full text-ember-300 transition-transform active:scale-95">
            <PlayIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            aria-label="Add task"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ember-500 text-ink-950 transition-transform active:scale-95">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <section className="glass-strong mt-6 rounded-3xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ember-400">Today</p>
            <p className="mt-1 font-display text-xl text-white">
              {completedToday} of {totalToday} tasks done
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {remainingFocusMinutes > 0
                ? `${formatMinutes(remainingFocusMinutes)} estimated focus remaining`
                : totalToday > 0
                  ? 'You’ve cleared today’s plan.'
                  : 'Add a task or start a focus session when you’re ready.'}
            </p>
          </div>
          <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold tabular-nums text-neutral-300">
            {Math.round(todayProgress * 100)}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Today's task completion"
          aria-valuemin={0}
          aria-valuemax={totalToday || 1}
          aria-valuenow={completedToday}
          className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ember-400 to-ember-600 transition-[width]"
            style={{ width: `${todayProgress * 100}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition-transform active:scale-[0.98]">
            <PlusIcon className="h-4 w-4" />
            Add task
          </button>
          <button
            onClick={() => navigate('/app/focus')}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/[0.06]">
            <PlayIcon className="h-3.5 w-3.5" />
            Quick focus
          </button>
        </div>
      </section>

      <div className="mt-7 space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {groups.map((group) =>
          <section key={group.label}>
            <h2 className={`mb-2.5 text-xs font-semibold uppercase tracking-wide ${group.label === 'Overdue' ? 'text-ember-300' : 'text-neutral-500'}`}>
              {group.label}<span className="ml-1.5 font-normal text-neutral-600">{group.items.length}</span>
            </h2>
            <div className="space-y-2">
              {group.items.map((task) =>
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onStartFocus={() => startFocusOn(task.id)}
                />
              )}
            </div>
          </section>
        )}
        {groups.length === 0 && (
          <div className="glass rounded-2xl px-5 py-7 text-center lg:col-span-2">
            <p className="text-sm font-medium text-white">
              {completedTasks.length > 0 ? 'Your active plan is clear.' : 'Start with one small task.'}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {completedTasks.length > 0
                ? 'Add another task or take a focus session at your own pace.'
                : 'Add a task to give your next focus session a direction.'}
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-ink-950 active:scale-[0.98]">
              <PlusIcon className="h-4 w-4" />
              Add your first task
            </button>
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <section className="mt-7">
          <button
            type="button"
            onClick={() => setShowCompleted((shown) => !shown)}
            aria-expanded={showCompleted}
            className="flex w-full items-center justify-between rounded-xl py-2 text-left">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Completed <span className="ml-1 text-neutral-600">{completedTasks.length}</span>
            </span>
            <ChevronDownIcon className={`h-4 w-4 text-neutral-500 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-2">
              {completedTasks.map((task) =>
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onStartFocus={() => startFocusOn(task.id)}
                />
              )}
            </div>
          )}
        </section>
      )}

      {showAdd && <AddTaskSheet onClose={() => setShowAdd(false)} />}
    </div>);

}