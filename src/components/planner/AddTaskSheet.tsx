import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useAppData } from '../../contexts/AppDataContext';

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
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      subject: subject.trim() || 'General',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 py-10">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="glass-strong relative w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-3xl px-5 pt-5 pb-6">
        
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-lg text-white">New Task</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="glass-inset w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Task</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read Chapter 5"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Estimated sessions</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) =>
              <button
                type="button"
                key={n}
                onClick={() => setPomodoros(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                pomodoros === n ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
                }>
                
                  {n}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Due date</label>
            <div className="flex gap-2">
              {dateOptions.map((o) =>
              <button
                type="button"
                key={o.label}
                onClick={() => setDueDate(o.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
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
              className="glass-inset mt-2 w-full rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-ember-400" />
            
          </div>
          <button
            type="submit"
            className="w-full py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-ember-400 to-ember-600 text-ink-950 shadow-glow active:scale-[0.98] transition-transform">
            
            Add Task
          </button>
        </form>
      </motion.div>
    </div>);

}