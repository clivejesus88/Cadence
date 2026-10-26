import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { AuthScreen } from '../components/auth/AuthScreen';
import { OnboardingDots } from '../components/onboarding/OnboardingDots';
import { TimerVisual } from '../components/onboarding/TimerVisual';
import { BlockVisual } from '../components/onboarding/BlockVisual';
import { InsightsVisual } from '../components/onboarding/InsightsVisual';
import { PlannerVisual } from '../components/onboarding/PlannerVisual';
import { Paywall } from '../components/onboarding/Paywall';

const HERO_IMAGE_URL = "/2db10ed4-907b-405f-a887-1dfb58489242.jpg";
const HERO_BLUR_URL = "/hero-blur.jpg";

const features = [
  {
    key: 'timer',
    Visual: TimerVisual,
    title: 'Find your flow',
    subtitle: 'Time blocks built for deep work—so you stay sharp without burning out.'
  },
  {
    key: 'block',
    Visual: BlockVisual,
    title: 'Protect your focus',
    subtitle: 'Automatically guard your attention the moment deep work begins.'
  },
  {
    key: 'insights',
    Visual: InsightsVisual,
    title: 'Level up over time',
    subtitle: 'Discover when you focus best and build habits that actually stick.'
  },
  {
    key: 'planner',
    Visual: PlannerVisual,
    title: 'Stay ahead with ease',
    subtitle: 'Turn your workload into doable focus blocks—no more deadline panic.'
  }
];


export function OnboardingFlow() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(() => {
    if (searchParams.get('paywall')) return 6;
    return 0;
  }); // 0 splash, 1-4 features, 5 auth, 6 paywall
  const navigate = useNavigate();
  const { user, isConfigured, continueAsGuest } = useAuth();

  useEffect(() => {
    if (user && !searchParams.get('paywall')) {
      navigate('/app/home', { replace: true });
    }
  }, [user, navigate, searchParams]);

  // Leaving the paywall (or skipping auth) drops you into the app as a guest
  // when there's no real session — never back to the onboarding start.
  const enterApp = () => {
    if (!user) continueAsGuest();
    navigate('/app/home', { replace: true });
  };
  const next = () => setStep((s) => Math.min(s + 1, 6));

  if (step === 0) {
    return (
      <div className="relative w-full min-h-[100dvh] flex flex-col justify-end bg-ink-950 overflow-hidden">
        <motion.img
          initial={{ scale: 1.02, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          src={HERO_IMAGE_URL}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/15" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[320px] -translate-x-1/2 rounded-full bg-ember-500/20 blur-[120px]" />
        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center sm:px-6">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="font-display italic text-4xl text-white tracking-tight sm:text-5xl">
            Cadence
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
            className="mt-2 text-sm text-neutral-300">
            Your rhythm. Your focus.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
            onClick={next}
            className="mt-8 w-full rounded-full bg-white py-4 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.995]">
            Get Started
          </motion.button>
        </div>
      </div>
    );
  }

  if (step >= 1 && step <= 4) {
    const idx = step - 1;
    const { Visual, title, subtitle } = features[idx];
    return (
      <div className="relative w-full min-h-[100dvh] flex flex-col overflow-hidden bg-ink-950 px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.img
            initial={{ scale: 1.12 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            src={HERO_BLUR_URL}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink-950/45" />
          <div className="absolute -top-10 -right-16 h-72 w-72 rounded-full bg-ember-500/25 blur-[100px]" />
          <div className="absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-sky-500/15 blur-[100px]" />
        </div>
        <div className="mx-auto flex w-full max-w-md items-center justify-end md:max-w-5xl">
          <button
            onClick={() => setStep(isConfigured ? 5 : 6)}
            className="hit-slop px-3 py-1 text-sm text-neutral-500 transition-colors hover:text-neutral-300 active:text-white">
            Skip
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.995 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="mx-auto flex flex-1 w-full max-w-md flex-col items-center justify-center text-center md:max-w-5xl md:flex-row md:gap-12 md:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.32, ease: 'easeOut' }}
              className="md:flex-1 md:scale-110">
              <Visual />
            </motion.div>
            <div className="md:flex-1">
              <p className="mt-8 font-display text-2xl text-white tracking-tight md:mt-0 md:text-4xl">{title}</p>
              <p className="mt-2.5 max-w-[280px] text-sm leading-6 text-neutral-400 md:max-w-md md:text-base md:leading-7">{subtitle}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mx-auto mb-6 w-full max-w-md md:max-w-5xl">
          <OnboardingDots total={4} current={idx} />
        </div>
        <div className="mx-auto w-full max-w-md md:max-w-5xl">
          <button
            onClick={next}
            className="w-full rounded-full bg-white py-4 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.995]">
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === 5) {
    if (!isConfigured) {
      return <Paywall onStart={enterApp} onClose={enterApp} />;
    }
    return (
      <AuthScreen
        onSuccess={() => setStep(6)}
        onBack={() => setStep(4)}
        onGuest={enterApp}
      />
    );
  }

  return <Paywall onStart={enterApp} onClose={enterApp} />;
}