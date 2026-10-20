import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { SessionToast } from '../notifications/SessionToast';
import { LogInIcon } from 'lucide-react';
import { useGamificationCelebration } from '../../utils/useGamificationCelebration';
import { LevelUpCelebration } from '../gamified/LevelUpCelebration';

const LOGIN_PROMPT_KEY = 'cadence:last-login-prompt';
const DAY_MS = 24 * 60 * 60 * 1000;

export function AppLayout() {
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const { celebration, clearCelebration } = useGamificationCelebration();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    lastScrollRef.current = 0;
    setNavVisible(true);
  }, [location.pathname]);

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
            duration={9000}
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

  // Hide the bar when scrolling down, bring it back the moment you scroll up
  // (or reach the top). Never force it visible mid-scroll, or the bar fights
  // the finger.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const y = el.scrollTop;
    const prev = lastScrollRef.current;
    lastScrollRef.current = y;

    if (y <= 24) {
      setNavVisible(true);
      return;
    }
    const delta = y - prev;
    if (delta > 6) setNavVisible(false);
    else if (delta < -6) setNavVisible(true);
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
      <LevelUpCelebration level={celebration} onDismiss={clearCelebration} />
    </div>);
}
