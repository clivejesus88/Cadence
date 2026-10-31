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
import { Avatar } from '../components/profile/Avatar';
import { avatarPresets, presetAvatarValue } from '../data/avatars';
import { updateProfile as persistProfile } from '../db/repo';
import { scheduleSync } from '../db/sync';

const HERO_IMAGE_URL = "/2db10ed4-907b-405f-a887-1dfb58489242.jpg";
const HERO_BLUR_URL = "/hero-blur.jpg";
const AVATAR_CHOICE_KEY_PREFIX = 'cadence:avatar-selected:';

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

function hasChosenAvatar(userId: string | null | undefined): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(`${AVATAR_CHOICE_KEY_PREFIX}${userId}`) === '1';
  } catch {
    return false;
  }
}


export function OnboardingFlow() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(() => {
    if (searchParams.get('paywall')) return 6;
    return 0;
  }); // 0 splash, 1-4 features, 5 auth, 6 paywall
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const navigate = useNavigate();
  const { user, isConfigured, continueAsGuest } = useAuth();

  useEffect(() => {
    if (user && !searchParams.get('paywall')) {
      if (hasChosenAvatar(user.id)) {
        navigate('/app/home', { replace: true });
      } else {
        setStep(7);
      }
    }
  }, [user, navigate, searchParams]);

  // The avatar choice is required before entering the app for the first time.
  const enterApp = () => {
    const userId = user?.id ?? 'guest';
    if (hasChosenAvatar(userId)) {
      if (!user) continueAsGuest();
      navigate('/app/home', { replace: true });
      return;
    }
    setStep(7);
  };

  const finishAvatarChoice = async () => {
    if (!selectedAvatar || avatarSaving) return;
    setAvatarSaving(true);
    setAvatarError('');
    try {
      if (!user) continueAsGuest();
      await persistProfile({ avatarUrl: selectedAvatar });
      scheduleSync();
      const userId = user?.id ?? 'guest';
      localStorage.setItem(`${AVATAR_CHOICE_KEY_PREFIX}${userId}`, '1');
      navigate('/app/home', { replace: true });
    } catch (error) {
      console.error('[onboarding] failed to save avatar choice:', error);
      setAvatarError('Could not save your avatar. Please try again.');
    } finally {
      setAvatarSaving(false);
    }
  };
  const next = () => setStep((s) => Math.min(s + 1, 6));

  if (step === 0) {
    return (
      <div className="relative flex min-h-[100dvh] w-full flex-col justify-end overflow-hidden bg-ink-950">
        <motion.img
          initial={{ scale: 1.02, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          src={HERO_IMAGE_URL}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_45%] md:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/15 md:bg-gradient-to-r md:from-ink-950/90 md:via-ink-950/55 md:to-ink-950/10" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[320px] -translate-x-1/2 rounded-full bg-ember-500/20 blur-[120px] md:bottom-[-8rem] md:left-[20%] md:h-[30rem] md:w-[30rem]" />
        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-center sm:px-6 md:mx-0 md:min-h-[100dvh] md:max-w-7xl md:items-start md:justify-center md:px-12 md:py-16 md:text-left lg:px-20">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="font-display italic text-4xl text-white tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Cadence
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
            className="mt-2 text-sm text-neutral-300 sm:text-base md:mt-4 md:text-lg">
            Your rhythm. Your focus.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
            onClick={next}
            className="mt-8 w-full rounded-full bg-white py-4 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.995] sm:mt-10 md:w-auto md:min-w-64 md:px-12">
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

  if (step === 7) {
    return (
      <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-ink-950 px-5 py-8">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <p className="font-display text-3xl tracking-tight text-white">Make it yours</p>
            <p className="mt-2 text-sm text-neutral-400">Choose your avatar to get started. You can change it anytime.</p>
          </div>
          <div className="glass rounded-3xl p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {avatarPresets.map((avatar) => {
                const value = presetAvatarValue(avatar.id);
                const selected = selectedAvatar === value;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    aria-label={`Choose ${avatar.name} avatar`}
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedAvatar(value);
                      setAvatarError('');
                    }}
                    className={`aspect-square rounded-2xl p-1 transition-all active:scale-95 ${
                      selected ? 'bg-white/[0.08] ring-1 ring-white/60' : 'bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}>
                    <Avatar value={value} className="h-full w-full" alt={avatar.name} />
                  </button>
                );
              })}
            </div>
            {avatarError && <p role="alert" className="mt-4 text-center text-sm text-red-300">{avatarError}</p>}
            <button
              type="button"
              onClick={() => void finishAvatarChoice()}
              disabled={!selectedAvatar || avatarSaving}
              className="mt-6 w-full rounded-full bg-white py-4 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-40">
              {avatarSaving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Paywall onStart={enterApp} onClose={enterApp} />;
}