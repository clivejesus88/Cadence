import React from 'react';
import { CircleIcon } from 'lucide-react';
import { Task } from '../../types/task';

interface TaskPreviewListProps {
  tasks: Task[];
}

export function TaskPreviewList({ tasks }: TaskPreviewListProps) {
  if (tasks.length === 0) {
    return <div className="glass rounded-2xl p-4 text-center text-sm text-neutral-500">All caught up — nothing due today.</div>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((t) =>
      <div key={t.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
          <CircleIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{t.title}</p>
            <p className="text-xs text-neutral-500">
              {t.subject} · {t.completedPomodoros}/{t.estimatedPomodoros} sessions
            </p>
          </div>
        </div>
      )}
    </div>);

}