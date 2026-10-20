import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  const [navVisible, setNavVisible] = useState(true);
  const settleTimer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => () => {
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setNavVisible(true);
  }, [location.pathname]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    if (el.scrollTop <= 24) {
      setNavVisible(true);
      return;
    }
    setNavVisible(false);
    settleTimer.current = window.setTimeout(() => setNavVisible(true), 420);
  };

  return (
    <div className="w-full min-h-[100dvh] bg-ink-950 flex justify-center">
      <div className="relative flex w-full max-w-md min-h-[100dvh] flex-col overflow-hidden bg-ink-950">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-16 -right-12 h-80 w-80 rounded-full bg-ember-500/30 blur-[100px]" />
          <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-sky-500/20 blur-[100px]" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="scroll-contain relative flex-1 overflow-y-auto pb-32 no-scrollbar">
          <Outlet />
        </div>
        <BottomNav visible={navVisible} />
      </div>
    </div>);
}
