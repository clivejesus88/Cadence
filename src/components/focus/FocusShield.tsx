import { useEffect, useState } from 'react';
import { ShieldCheckIcon, PlayIcon, SquareIcon } from 'lucide-react';
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
    <Modal open={visible} onClose={onEndSession} dismissOnBackdrop={false} contentClassName="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ember-500/15 ring-1 ring-ember-400/30">
        <ShieldCheckIcon className="h-8 w-8 text-ember-400" />
      </div>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-ember-300">Cadence</p>
      <h2 className="font-display mt-1.5 text-2xl text-white">Your focus is still here.</h2>
      <blockquote className="mx-auto mt-3 max-w-[300px] text-sm font-medium italic leading-6 text-ember-200">
        {reminder}
      </blockquote>
      <p className="mx-auto mt-2.5 max-w-[300px] text-sm leading-6 text-neutral-400">
        Your session is still running
        {taskTitle ? <> for <span className="text-white">{taskTitle}</span></> : null}. Come back when you’re ready to keep going.
      </p>

      <div className="modal-divider mx-auto mt-6 h-px w-full" />

      <div className="mt-6 space-y-3">
        <button
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-ember-400 to-ember-600 py-4 text-[15px] font-bold text-ink-950 transition-transform active:scale-[0.98]">
          <PlayIcon className="h-5 w-5" />
          Keep this session
        </button>
        <button
          onClick={onEndSession}
          className="glass flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold text-white transition-transform active:scale-[0.98]">
          <SquareIcon className="h-4 w-4" />
          End session
        </button>
      </div>
    </Modal>
  );
}
