import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
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
  const todayTasks = groups.find((group) => group.label === 'Today')?.items ?? [];
  const upcomingGroups = groups.filter((group) => group.label !== 'Today');

  return (
    <div className="px-5 pt-8 pb-8 lg:px-8 lg:pt-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {format(new Date(), 'EEEE · MMM d')}
          </p>
          <h1 className="mt-1 font-display text-3xl text-white">Planner</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          aria-label="Add task"
          className="glass-inset flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 active:scale-95">
          <PlusIcon className="h-5 w-5" />
        </button>
      </header>

      <section className="mt-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-white">Today</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {remainingFocusMinutes > 0
                ? `About ${formatMinutes(remainingFocusMinutes)} of focus left`
                : totalToday > 0
                  ? 'Today’s plan is complete.'
                  : 'A little focus goes a long way.'}
            </p>
          </div>
          <p className="pt-1 text-xs tabular-nums text-neutral-500">
            <span className="font-medium text-neutral-300">{completedToday}</span> / {totalToday}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Today's task completion"
          aria-valuemin={0}
          aria-valuemax={totalToday || 1}
          aria-valuenow={completedToday}
          className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-ember-400 transition-[width]"
            style={{ width: `${todayProgress * 100}%` }}
          />
        </div>
      </section>

      <div className="mt-7">
        {todayTasks.length > 0 ? (
          <section>
            <div className="space-y-2">
              {todayTasks.map((task) =>
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onStartFocus={() => startFocusOn(task.id)}
                />
              )}
            </div>
          </section>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-neutral-500">
            {totalToday > 0 ? 'You’ve completed today’s planned tasks.' : 'Nothing scheduled for today.'}
          </p>
        )}
      </div>

      {upcomingGroups.length > 0 && (
        <div className="mt-8 border-t border-white/[0.07] pt-6 lg:grid lg:grid-cols-2 lg:gap-x-6">
          {upcomingGroups.map((group) =>
            <section key={group.label} className="mb-6 last:mb-0">
              <h2 className={`mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${group.label === 'Overdue' ? 'text-ember-300' : 'text-neutral-500'}`}>
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
        </div>
      )}

      {completedTasks.length > 0 && (
        <section className="mt-7 border-t border-white/[0.07] pt-4">
          <button
            type="button"
            onClick={() => setShowCompleted((shown) => !shown)}
            aria-expanded={showCompleted}
            className="flex w-full items-center justify-between py-2 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
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