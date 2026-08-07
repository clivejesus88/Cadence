import React from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { ambientSounds } from '../../data/ambientSounds';
import { blockedApps } from '../../data/blockedApps';
import { Task } from '../../types/task';

interface SessionSetupProps {
  durationMinutes: number;
  onChangeDuration: (m: number) => void;
  soundId: string;
  onChangeSound: (id: string) => void;
  blockingEnabled: boolean;
  onToggleBlocking: (v: boolean) => void;
  activeTask?: Task;
  onStart: () => void;
}

const presets = [15, 25, 50, 90];

export function SessionSetup({
  durationMinutes,
  onChangeDuration,
  soundId,
  onChangeSound,
  blockingEnabled,
  onToggleBlocking,
  activeTask,
  onStart
}: SessionSetupProps) {
  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl text-white">Focus Session</h1>
      <p className="text-neutral-400 text-sm mt-1">Set up your session, then dive in.</p>

      {activeTask &&
      <div className="glass mt-5 flex items-center gap-3 rounded-2xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-ember-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{activeTask.title}</p>
            <p className="text-xs text-neutral-400">{activeTask.subject}</p>
          </div>
        </div>
      }

      <div className="mt-6">
        <p className="text-white font-semibold text-sm mb-3">Duration</p>
        <div className="flex gap-2">
          {presets.map((p) =>
          <button
            key={p}
            onClick={() => onChangeDuration(p)}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors ${
            durationMinutes === p ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
            }>
            
              {p}m
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-white font-semibold text-sm mb-3">Focus Sound</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {ambientSounds.map((s) => {
            const Icon = s.icon;
            const selected = soundId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChangeSound(s.id)}
                className={`flex-shrink-0 w-24 rounded-2xl p-3 text-left transition-colors ${
                selected ? 'bg-ember-500/15 border border-ember-400' : 'glass-inset'}`
                }>
                
                <Icon className={`w-5 h-5 ${selected ? 'text-ember-400' : 'text-neutral-400'}`} />
                <p className={`text-xs font-medium mt-2 ${selected ? 'text-white' : 'text-neutral-300'}`}>{s.name}</p>
              </button>);

          })}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => onToggleBlocking(!blockingEnabled)}
          className="glass w-full flex items-center justify-between rounded-2xl px-4 py-3.5">
          
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className={`w-5 h-5 ${blockingEnabled ? 'text-ember-400' : 'text-neutral-500'}`} />
            <div className="text-left">
              <p className="text-sm text-white font-medium">Block Distractions</p>
              <p className="text-xs text-neutral-400">
                {blockedApps.filter((a) => a.blockedByDefault).length} apps muted during focus
              </p>
            </div>
          </div>
          <div
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
            blockingEnabled ? 'bg-ember-500 justify-end' : 'bg-white/10 justify-start'}`
            }>
            
            <div className="w-5 h-5 rounded-full bg-white" />
          </div>
        </button>
      </div>

      <button
        onClick={onStart}
        className="w-full mt-8 py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-ember-400 to-ember-600 text-ink-950 shadow-glow active:scale-[0.98] transition-transform">
        
        Start Focusing
      </button>
    </div>);

}