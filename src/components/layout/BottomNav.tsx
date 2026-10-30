import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon, TimerIcon, BarChart3Icon, ListChecksIcon, SettingsIcon, TrophyIcon } from 'lucide-react';

const navItems = [
  { to: '/app/home', label: 'Home', icon: HomeIcon },
  { to: '/app/focus', label: 'Focus', icon: TimerIcon },
  { to: '/app/insights', label: 'Insights', icon: BarChart3Icon },
  { to: '/app/leaderboard', label: 'Ranks', icon: TrophyIcon },
  { to: '/app/planner', label: 'Planner', icon: ListChecksIcon },
  { to: '/app/profile', label: 'Settings', icon: SettingsIcon }
];

export function BottomNav({ visible = true }: { visible?: boolean }) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    if (visible) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [visible]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      initial={false}
      animate={{ y: visible ? 0 : 140 }}
      transition={{ type: 'spring', stiffness: 480, damping: 40, mass: 0.9 }}>
      <nav
        ref={navRef}
        aria-label="Primary"
        className="glass-nav pointer-events-auto mx-auto flex items-center justify-between gap-1 rounded-[28px] p-1.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="relative flex-1 rounded-[22px] px-1 py-2.5 transition-transform active:scale-95">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-[22px] bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_-6px_rgba(0,0,0,0.6)]"
                    transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.8 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <Icon
                    className={`h-[22px] w-[22px] transition-all duration-300 ${
                      isActive ? 'text-ember-400 scale-105' : 'text-neutral-400 scale-100'
                    }`}
                    strokeWidth={isActive ? 2.3 : 1.9}
                  />
                  <span
                    className={`text-[10px] tracking-wide transition-colors duration-300 ${
                      isActive ? 'font-semibold text-white' : 'font-medium text-neutral-400'
                    }`}>
                    {label}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.div>
  );
}

export function DesktopNav() {
  return (
    <aside className="glass-inset hidden h-full w-56 flex-shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/70 px-4 py-6 md:flex lg:w-64">
      <div className="px-3">
        <p className="font-display text-2xl italic tracking-tight text-white">Cadence</p>
        <p className="mt-1 text-xs text-neutral-500">Your rhythm. Your focus.</p>
      </div>
      <nav aria-label="Primary" className="mt-10 flex flex-1 flex-col gap-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                  : 'text-neutral-400 hover:bg-white/[0.06] hover:text-white'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon className={`h-5 w-5 ${isActive ? 'text-ember-400' : ''}`} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
