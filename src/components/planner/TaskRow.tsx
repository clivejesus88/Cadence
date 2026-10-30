
import { CheckIcon, PlayIcon } from 'lucide-react';
import { Task } from '../../types/task';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onStartFocus: () => void;
}

export function TaskRow({ task, onToggle, onStartFocus }: TaskRowProps) {
  return (
    <div className="group flex items-center gap-3 border-b border-white/[0.06] px-1 py-3.5 transition-colors last:border-b-0 hover:bg-white/[0.02]">
      <button
        onClick={onToggle}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`hit-slop flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all active:scale-90 ${
          task.completed
            ? 'border-ember-400 bg-ember-400'
            : 'border-white/25 group-hover:border-ember-300'
        }`}>
        {task.completed && <CheckIcon className="w-3 h-3 text-ink-950" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${task.completed ? 'text-neutral-500 line-through' : 'text-neutral-100'}`}>
          {task.title}
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-neutral-500">
          <span className="truncate">{task.subject}</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span className="flex-shrink-0 tabular-nums">
            {task.completedPomodoros}/{task.estimatedPomodoros} sessions
          </span>
        </div>
      </div>
      {!task.completed && (
        <button
          onClick={onStartFocus}
          aria-label={`Start focus session for ${task.title}`}
          className="hit-slop flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-ember-300 active:scale-90">
          <PlayIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>);

}