import React from 'react';
import { CheckIcon } from 'lucide-react';

const rows = [
{ title: 'Problem Set 4', done: true },
{ title: 'Read Chapter 7', done: false },
{ title: 'Outline Essay', done: false }];


export function PlannerVisual() {
  return (
    <div className="w-full max-w-[260px]">
      <div className="glass-strong rounded-3xl p-5 space-y-2.5">
        {rows.map((r, i) =>
        <div key={i} className="glass-inset flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div
            className={`w-5 h-5 rounded-full flex items-center justify-center border flex-shrink-0 ${
            r.done ? 'bg-ember-500 border-ember-500' : 'border-neutral-500'}`
            }>
            
              {r.done && <CheckIcon className="w-3 h-3 text-ink-950" />}
            </div>
            <p className={`text-sm ${r.done ? 'text-neutral-500 line-through' : 'text-white'}`}>{r.title}</p>
          </div>
        )}
      </div>
    </div>);

}