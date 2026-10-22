import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useAppData } from '../../contexts/AppDataContext';
import { Modal, ModalHeader } from '../ui/Modal';
import { sanitizeText } from '../../utils/sanitize';

interface AddTaskSheetProps {
  onClose: () => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export function AddTaskSheet({ onClose }: AddTaskSheetProps) {
  const { addTask } = useAppData();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [pomodoros, setPomodoros] = useState(2);
  const [dueDate, setDueDate] = useState(today);

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
      <ModalHeader
      eyebrow="Planner"
      title="New Task"
      subtitle="Break your work into focused sessions."
      onClose={onClose} />

      <div className="modal-divider my-5 h-px" />

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-task-title" className="text-xs text-neutral-500 mb-1.5 block">Task</label>
            <input
              id="new-task-title"
              autoFocus
              enterKeyHint="next"
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read Chapter 5"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label htmlFor="new-task-subject" className="text-xs text-neutral-500 mb-1.5 block">Subject</label>
            <input
              id="new-task-subject"
              maxLength={60}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <span className="text-xs text-neutral-500 mb-1.5 block">Estimated sessions</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) =>
              <button
                type="button"
                key={n}
                onClick={() => setPomodoros(n)}
                aria-pressed={pomodoros === n}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                pomodoros === n ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
                }>
                
                  {n}
                </button>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-neutral-500 mb-1.5 block">Due date</span>
            <div className="flex gap-2">
              {dateOptions.map((o) =>
              <button
                type="button"
                key={o.label}
                onClick={() => setDueDate(o.value)}
                aria-pressed={dueDate === o.value}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
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
              className="glass-inset mt-2 w-full rounded-xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-ember-400" />
            
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
              className="flex-1 py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-ember-400 to-ember-600 text-ink-950 active:scale-[0.98] transition-transform">
              Add Task
            </button>
          </div>
      </form>
    </Modal>);

}
