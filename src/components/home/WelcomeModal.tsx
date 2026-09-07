
import { motion } from 'framer-motion';
import { TimerIcon, ShieldCheckIcon, FlameIcon, SparklesIcon, XIcon } from 'lucide-react';

interface WelcomeModalProps {
  name: string;
  avatarUrl: string;
  onDismiss: () => void;
}

const highlights = [
{ icon: TimerIcon, title: 'Focus in sprints', desc: 'Start a session in one tap, or dial in your own time.' },
{ icon: ShieldCheckIcon, title: 'Block distractions', desc: 'Your noisiest apps stay quiet while you work.' },
{ icon: FlameIcon, title: 'Build your streak', desc: 'Small daily sessions compound fast.' }];


const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } }
};

export function WelcomeModal({ name, avatarUrl, onDismiss }: WelcomeModalProps) {
  const firstName = name.split(' ')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label="Welcome">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
        onClick={onDismiss} />
      
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="glass-strong relative w-full max-w-sm overflow-hidden rounded-[28px] p-6 text-center">
        
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-ember-500/25 blur-3xl" />

        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="glass-inset absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white">
          
          <XIcon className="h-4 w-4" />
        </button>

        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 -m-1.5 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 opacity-70 blur-[6px]" />
          <img
            src={avatarUrl}
            alt={name}
            className="relative h-20 w-20 rounded-full object-cover ring-[3px] ring-ink-900" />
          
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ember-500 ring-[3px] ring-ink-900">
            <SparklesIcon className="h-3.5 w-3.5 text-ink-950" />
          </div>
        </div>

        <h2 className="font-display mt-4 text-2xl tracking-tight text-white">Welcome, {firstName}</h2>
        <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-neutral-400">
          Cadence is set up and ready. Here's how to get the most out of your study time.
        </p>

        <motion.div initial="hidden" animate="visible" variants={listVariants} className="mt-6 space-y-3 text-left">
          {highlights.map(({ icon: Icon, title, desc }) =>
          <motion.div
            key={title}
            variants={itemVariants}
            className="glass-inset flex items-start gap-3 rounded-2xl px-3.5 py-3">
            
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                <Icon className="h-4 w-4 text-ember-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{desc}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        <button
          onClick={onDismiss}
          className="mt-6 w-full rounded-full bg-white py-3.5 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.98]">
          
          Let's focus
        </button>
      </motion.div>
    </div>);

}