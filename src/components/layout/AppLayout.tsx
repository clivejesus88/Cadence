import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="w-full min-h-screen bg-ink-950 flex justify-center">
      <div className="relative flex w-full max-w-md min-h-screen flex-col overflow-hidden bg-ink-950">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-16 -right-12 h-80 w-80 rounded-full bg-ember-500/30 blur-[100px]" />
          <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-sky-500/20 blur-[100px]" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
        </div>
        <div className="relative z-10 flex-1 overflow-y-auto pb-28 no-scrollbar">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>);

}