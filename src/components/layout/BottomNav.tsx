import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon, TimerIcon, BarChart3Icon, ListChecksIcon } from 'lucide-react';

const navItems = [
{ to: '/app/home', label: 'Home', icon: HomeIcon },
{ to: '/app/focus', label: 'Focus', icon: TimerIcon },
{ to: '/app/insights', label: 'Insights', icon: BarChart3Icon },
{ to: '/app/planner', label: 'Planner', icon: ListChecksIcon }];


export function BottomNav() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary"
        className="glass-nav pointer-events-auto mx-auto flex items-center justify-between gap-1 rounded-[28px] p-1.5">
        
        {navItems.map(({ to, label, icon: Icon }) =>
        <NavLink key={to} to={to} className="relative flex-1 rounded-[22px] px-1 py-2.5">
            {({ isActive }) =>
          <>
                {isActive &&
            <motion.span
              layoutId="nav-active-pill"
              className="absolute inset-0 rounded-[22px] bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_-6px_rgba(0,0,0,0.6)]"
              transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.8 }} />

            }
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <Icon
                className={`h-[22px] w-[22px] transition-all duration-300 ${
                isActive ? 'text-ember-400 scale-105' : 'text-neutral-400 scale-100'}`
                }
                strokeWidth={isActive ? 2.3 : 1.9} />
              
                  <span
                className={`text-[10px] tracking-wide transition-colors duration-300 ${
                isActive ? 'font-semibold text-white' : 'font-medium text-neutral-400'}`
                }>
                
                    {label}
                  </span>
                </span>
              </>
          }
          </NavLink>
        )}
      </nav>
    </div>);

}