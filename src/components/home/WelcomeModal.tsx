import React from 'react';
import { motion } from 'framer-motion';
import { TimerIcon, ShieldCheckIcon, FlameIcon, SparklesIcon } from 'lucide-react';

interface WelcomeModalProps {
  name: string;
  onDismiss: () => void;
}

const highlights = [
{ icon: TimerIcon, title: 'Focus in sprints', desc: 'Start a 25-minute session in one tap.' },
{ icon: ShieldCheckIcon, title: 'Block distractions', desc: 'Your noisiest apps stay quiet while you work.' },
{ icon: FlameIcon, title: 'Build your streak', desc: 'Small daily sessions compound fast.' }];


export function WelcomeModal({ name, onDismiss }: WelcomeModalProps) {
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
        className="glass-strong relative w-full max-w-sm rounded-[28px] p-6 text-center">
        
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-500/20">
          <SparklesIcon className="h-6 w-6 text-ember-400" />
        </div>

        <h2 className="font-display mt-4 text-2xl text-white">Welcome, {firstName}</h2>
        <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-neutral-400">
          Cadence is set up and ready. Here's how to get the most out of your study time.
        </p>

        <div className="mt-6 space-y-3 text-left">
          {highlights.map(({ icon: Icon, title, desc }) =>
          <div key={title} className="glass-inset flex items-start gap-3 rounded-2xl px-3.5 py-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                <Icon className="h-4 w-4 text-ember-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{desc}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="mt-6 w-full rounded-full bg-white py-3.5 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.98]">
          
          Let's focus
        </button>
      </motion.div>
    </div>);

}