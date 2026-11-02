
import { CircleIcon, PlayIcon } from 'lucide-react';
import { Task } from '../../types/task';

interface TaskPreviewListProps {
  tasks: Task[];
  onStartFocus: (taskId: string) => void;
}

export function TaskPreviewList({ tasks, onStartFocus }: TaskPreviewListProps) {
  if (tasks.length === 0) {
    return <div className="glass rounded-2xl p-4 text-center text-sm text-neutral-500">All caught up — nothing due today.</div>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onStartFocus(t.id)}
          aria-label={`Start a focus session for ${t.title}`}
          className="glass group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:border-white/[0.14] hover:bg-white/[0.04] active:scale-[0.99]">
          <CircleIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{t.title}</p>
            <p className="text-xs text-neutral-500">
              {t.subject} · {t.completedPomodoros}/{t.estimatedPomodoros} sessions
            </p>
          </div>
          <PlayIcon className="h-4 w-4 flex-shrink-0 text-neutral-600 transition-colors group-hover:text-ember-300" />
        </button>
      ))}
    </div>);
}