import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useAppData } from '../../contexts/AppDataContext';
import { Modal, ModalHeader } from '../ui/Modal';
import { sanitizeText } from '../../utils/sanitize';

interface AddTaskSheetProps {
  onClose: () => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

const fieldClass =
  'glass-inset w-full rounded-xl px-3.5 py-3 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400';

export function AddTaskSheet({ onClose }: AddTaskSheetProps) {
  const { addTask } = useAppData();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [pomodoros, setPomodoros] = useState(2);
  const [dueDate, setDueDate] = useState(today);
  const canSubmit = sanitizeText(title, 140).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, 140);
    if (!cleanTitle) return;
    addTask({
      title: cleanTitle,
      subject: sanitizeText(subject, 60) || 'General',
      estimatedPomodoros: pomodoros,
      dueDate
    });
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
          title="New Task"
          subtitle="Break your work into focused sessions."
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
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) =>
                <button
                  type="button"
                  key={n}
                  onClick={() => setPomodoros(n)}
                  aria-pressed={pomodoros === n}
                  className={`min-w-0 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${
                  pomodoros === n ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
                  }>
                  {n}
                </button>
                )}
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
                min={today()}
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
              Add Task
            </button>
          </div>
        </form>
      </div>
    </Modal>);
}
