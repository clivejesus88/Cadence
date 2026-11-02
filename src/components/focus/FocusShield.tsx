import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../ui/Modal';

const FOCUS_REMINDERS = [
  '“The next small step is enough. Come back and take it.”',
  '“You’ve already begun. Give this moment your attention.”',
  '“Progress happens one focused minute at a time.”',
  '“Stay with what matters; you’re closer than you think.”'
];

interface FocusShieldProps {
  visible: boolean;
  taskTitle?: string;
  onContinue: () => void;
  onEndSession: () => void;
}

export function FocusShield({ visible, taskTitle, onContinue, onEndSession }: FocusShieldProps) {
  const [reminder, setReminder] = useState(FOCUS_REMINDERS[0]);

  useEffect(() => {
    if (visible) {
      setReminder(FOCUS_REMINDERS[Math.floor(Math.random() * FOCUS_REMINDERS.length)]);
    }
  }, [visible]);

  return (
    <Modal open={visible} onClose={onEndSession} dismissOnBackdrop={false} contentClassName="text-center !px-7 !pb-7 !pt-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}>
        <div className="mx-auto mb-6 h-px w-12 bg-gradient-to-r from-transparent via-ember-300/80 to-transparent" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ember-300/80">A moment to return</p>
        <blockquote className="mx-auto mt-5 max-w-[300px] font-display text-lg italic leading-7 text-neutral-200">
          {reminder}
        </blockquote>
        <p className="mx-auto mt-4 max-w-[300px] text-[13px] leading-6 text-neutral-400">
          Your session is still running
          {taskTitle ? <> for <span className="font-medium text-neutral-200">{taskTitle}</span></> : null}. Come back when you’re ready to keep going.
        </p>

        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            onClick={onContinue}
            className="group relative min-w-32 overflow-hidden rounded-full bg-gradient-to-b from-ember-200 via-ember-400 to-ember-600 p-px shadow-[0_8px_24px_-12px_rgba(251,146,60,0.8)] transition-transform active:scale-[0.97]">
            <span className="flex items-center justify-center rounded-full bg-gradient-to-b from-ember-300 to-ember-500 px-6 py-2.5 text-xs font-bold tracking-wide text-ink-950 transition-colors group-hover:from-amber-200 group-hover:to-ember-400">
              Resume
            </span>
          </button>
          <button
            onClick={onEndSession}
            className="min-w-20 rounded-full border border-white/[0.1] bg-white/[0.025] px-5 py-2.5 text-xs font-medium tracking-wide text-neutral-400 transition-colors hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white active:scale-[0.97]">
            End
          </button>
        </div>
      </motion.div>
    </Modal>
  );
}
