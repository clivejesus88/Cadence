import React from 'react';
import { CircularTimer } from '../CircularTimer';

export function TimerVisual() {
  return (
    <div className="flex items-center justify-center">
      <CircularTimer progress={0.62} size={220} strokeWidth={12}>
        <div className="text-center">
          <p className="font-display text-4xl text-white">18:24</p>
          <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">Focus Session</p>
        </div>
      </CircularTimer>
    </div>);

}