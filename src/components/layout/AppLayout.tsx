import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';

const LOGIN_PROMPT_KEY = 'cadence:last-login-prompt';
const DAY_MS = 24 * 60 * 60 * 1000;

export function AppLayout() {
  const [navVisible, setNavVisible] = useState(true);
  const settleTimer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  useEffect(() => () => {
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setNavVisible(true);
  }, [location.pathname]);

  // Guests get a gentle sign-in nudge at most once every 24 hours.
  useEffect(() => {
    if (!isGuest) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(LOGIN_PROMPT_KEY) ?? '0');
    } catch {
      // storage unavailable — prompt each visit is too aggressive, skip
      return;
    }
    if (Date.now() - last < DAY_MS) return;
    try {
      localStorage.setItem(LOGIN_PROMPT_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    const timer = window.setTimeout(() => {
      toast('Sign in to sync your focus data across devices', {
        duration: 10000,
        action: { label: 'Sign in', onClick: () => navigate('/sign-in') }
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [isGuest, navigate]);

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
