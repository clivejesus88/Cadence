import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { SessionToast } from '../notifications/SessionToast';
import { LogInIcon } from 'lucide-react';
import { useGamificationCelebration } from '../../utils/useGamificationCelebration';

const LOGIN_PROMPT_KEY = 'cadence:last-login-prompt';
const DAY_MS = 24 * 60 * 60 * 1000;

export function AppLayout() {
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  useGamificationCelebration();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    lastScrollRef.current = 0;
    setNavVisible(true);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    };
  }, []);

  // Guests get a gentle sign-in nudge at most once every 24 hours.
  useEffect(() => {
    if (!isGuest) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(LOGIN_PROMPT_KEY) ?? '0');
    } catch {
      // storage unavailable — prompting each visit is too aggressive, skip
      return;
    }
    if (Date.now() - last < DAY_MS) return;
    try {
      localStorage.setItem(LOGIN_PROMPT_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    const timer = window.setTimeout(() => {
      toast.custom(
        (id) => (
          <SessionToast
            id={id}
            icon={LogInIcon}
            title="You're browsing as a guest"
            description="Sign in to sync your focus data across devices."
            tone="info"
            action={{ label: 'Sign in', onClick: () => navigate('/sign-in') }}
          />
        ),
        { duration: 9000 }
      );
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [isGuest, navigate]);

  // Hide the bar while scrolling down; the instant scrolling stops, bring it
  // back at the bottom of the viewport. Never leave the user without the bar.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      const prev = lastScrollRef.current;
      lastScrollRef.current = y;

      if (y <= 24) {
        setNavVisible(true);
      } else {
        const delta = y - prev;
        if (delta > 4) setNavVisible(false);
        else if (delta < -4) setNavVisible(true);
      }

      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => setNavVisible(true), 180);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    };
  }, []);

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
          className="scroll-contain relative flex-1 overflow-y-auto pb-32 no-scrollbar">
          <Outlet />
        </div>
        <BottomNav visible={navVisible} />
      </div>
    </div>);
}
