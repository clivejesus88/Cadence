
import { CheckIcon, PlayIcon } from 'lucide-react';
import { Task } from '../../types/task';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onStartFocus: () => void;
}

export function TaskRow({ task, onToggle, onStartFocus }: TaskRowProps) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
      <button
        onClick={onToggle}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`w-5 h-5 rounded-full flex items-center justify-center border flex-shrink-0 ${
        task.completed ? 'bg-ember-500 border-ember-500' : 'border-neutral-500'}`
        }>
        
        {task.completed && <CheckIcon className="w-3 h-3 text-ink-950" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.completed ? 'text-neutral-500 line-through' : 'text-white'}`}>{task.title}</p>
        <p className="text-xs text-neutral-500">
          {task.subject} · {task.completedPomodoros}/{task.estimatedPomodoros} sessions
        </p>
      </div>
      {!task.completed &&
      <button
        onClick={onStartFocus}
        aria-label="Start focus session"
        className="glass-inset w-8 h-8 rounded-full flex items-center justify-center text-ember-400 flex-shrink-0">
        
          <PlayIcon className="w-3.5 h-3.5" />
        </button>
      }
    </div>);

}