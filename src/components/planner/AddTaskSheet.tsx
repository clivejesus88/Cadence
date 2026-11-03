import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useAppData } from '../../contexts/AppDataContext';
import { Modal, ModalHeader } from '../ui/Modal';
import { sanitizeText } from '../../utils/sanitize';
import { Task } from '../../types/task';

interface AddTaskSheetProps {
  task?: Task;
  onClose: () => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

const fieldClass =
  'glass-inset w-full rounded-xl px-3.5 py-3 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400';

export function AddTaskSheet({ task, onClose }: AddTaskSheetProps) {
  const { addTask, updateTask } = useAppData();
  const [title, setTitle] = useState(task?.title ?? '');
  const [subject, setSubject] = useState(task?.subject ?? '');
  const [pomodoros, setPomodoros] = useState(task
    ? Math.max(task.estimatedPomodoros, Math.min(task.completedPomodoros, 20))
    : 2);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? today());
  const minimumSessions = Math.min(20, Math.max(1, task?.completedPomodoros ?? 1));
  const canSubmit = sanitizeText(title, 140).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, 140);
    if (!cleanTitle) return;
    const values = {
      title: cleanTitle,
      subject: sanitizeText(subject, 60) || 'General',
      estimatedPomodoros: pomodoros,
      dueDate
    };
    if (task) updateTask(task.id, values);
    else addTask(values);
    onClose();
  };

  const dateOptions = [
    { label: 'Today', value: today() },
    { label: 'Tomorrow', value: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: 'Next week', value: format(addDays(new Date(), 7), 'yyyy-MM-dd') }
  ];

  return (
    <Modal open onClose={onClose} variant="sheet">
      <div className="flex h-full min-h-0 flex-col">
        <ModalHeader
          eyebrow="Planner"
          title={task ? 'Edit Task' : 'New Task'}
          subtitle={task ? 'Adjust the details and estimated sessions.' : 'Break your work into focused sessions.'}
          onClose={onClose} />

        <div className="modal-divider my-4 h-px shrink-0" />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
            <div>
              <label htmlFor="new-task-title" className="mb-1.5 block text-xs text-neutral-500">Task</label>
              <input
                id="new-task-title"
                enterKeyHint="next"
                autoComplete="off"
                autoCapitalize="sentences"
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Read Chapter 5"
                className={fieldClass} />
            </div>
            <div>
              <label htmlFor="new-task-subject" className="mb-1.5 block text-xs text-neutral-500">Subject</label>
              <input
                id="new-task-subject"
                enterKeyHint="done"
                autoComplete="off"
                autoCapitalize="sentences"
                maxLength={60}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology"
                className={fieldClass} />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-neutral-500">Estimated sessions</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease estimated sessions"
                  onClick={() => setPomodoros((count) => Math.max(minimumSessions, count - 1))}
                  disabled={pomodoros <= minimumSessions}
                  className="glass-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-neutral-200 disabled:opacity-40">
                  −
                </button>
                <input
                  type="number"
                  min={minimumSessions}
                  max={20}
                  step={1}
                  value={pomodoros}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (e.target.value && Number.isFinite(value)) {
                      setPomodoros(Math.min(20, Math.max(minimumSessions, Math.round(value))));
                    }
                  }}
                  aria-label="Estimated sessions"
                  className={`${fieldClass} min-w-0 text-center tabular-nums`} />
                <button
                  type="button"
                  aria-label="Increase estimated sessions"
                  onClick={() => setPomodoros((count) => Math.min(20, count + 1))}
                  disabled={pomodoros >= 20}
                  className="glass-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-neutral-200 disabled:opacity-40">
                  +
                </button>
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-neutral-500">Due date</span>
              <div className="grid grid-cols-3 gap-2">
                {dateOptions.map((o) =>
                <button
                  type="button"
                  key={o.label}
                  onClick={() => setDueDate(o.value)}
                  aria-pressed={dueDate === o.value}
                  className={`min-w-0 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${
                  dueDate === o.value ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
                  }>
                  {o.label}
                </button>
                )}
              </div>
              <input
                type="date"
                value={dueDate}
                min={task ? undefined : today()}
                onChange={(e) => e.target.value && setDueDate(e.target.value)}
                aria-label="Custom due date"
                className={`${fieldClass} mt-2 [color-scheme:dark]`} />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="glass rounded-full px-6 py-4 text-[15px] font-semibold text-neutral-300 transition-colors hover:text-white active:scale-[0.98]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-full bg-gradient-to-r from-ember-400 to-ember-600 py-4 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100">
              {task ? 'Save changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </Modal>);
}
