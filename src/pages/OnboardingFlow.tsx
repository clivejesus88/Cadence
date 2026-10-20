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

const features = [
{
  key: 'timer',
  Visual: TimerVisual,
  title: 'Focus in Sprints',
  subtitle: 'Structured Pomodoro sessions keep you sharp and help you avoid burnout.'
},
{
  key: 'block',
  Visual: BlockVisual,
  title: 'Block Distractions',
  subtitle: 'Silence social media and notifications the moment a session starts.'
},
{
  key: 'insights',
  Visual: InsightsVisual,
  title: 'See Your Patterns',
  subtitle: 'Understand when and how you focus best, backed by real data.'
},
{
  key: 'planner',
  Visual: PlannerVisual,
  title: 'Plan Your Study Time',
  subtitle: 'Turn assignments into sessions and never lose track of deadlines.'
}];


export function OnboardingFlow() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(() => {
    if (searchParams.get('paywall')) return 6;
    return 0;
  }); // 0 splash, 1-4 features, 5 auth, 6 paywall
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !searchParams.get('paywall')) {
      navigate('/app/home', { replace: true });
    }
  }, [user, navigate, searchParams]);

  const goHome = () => navigate('/app/home', { replace: true });
  const next = () => setStep((s) => Math.min(s + 1, 6));

  if (step === 0) {
    return (
      <div className="relative w-full min-h-[100dvh] flex flex-col justify-end bg-ink-950">
        <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/15" />
        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] text-center sm:px-6">
          <p className="font-display italic text-4xl text-white sm:text-5xl">Cadence</p>
          <p className="mt-2 text-sm text-neutral-300">Focus that fits your rhythm.</p>
          <button
            onClick={next}
            className="mt-8 w-full rounded-full bg-white py-4 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.98]">
            
            Get Started
          </button>
        </div>
      </div>);

  }

  if (step >= 1 && step <= 4) {
    const idx = step - 1;
    const { Visual, title, subtitle } = features[idx];
    return (
      <div className="relative w-full min-h-[100dvh] flex flex-col overflow-hidden bg-ink-950 px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <img src={HERO_IMAGE_URL} alt="" className="h-full w-full scale-110 object-cover blur-2xl" />
          <div className="absolute inset-0 bg-ink-950/45" />
          <div className="absolute -top-10 -right-16 h-72 w-72 rounded-full bg-ember-500/25 blur-[100px]" />
          <div className="absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-sky-500/15 blur-[100px]" />
        </div>
        <div className="mx-auto flex w-full max-w-md items-center justify-end">
          <button onClick={() => setStep(5)} className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
            Skip
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mx-auto flex flex-1 w-full max-w-md flex-col items-center justify-center text-center">
            
            <Visual />
            <p className="mt-8 font-display text-2xl text-white">{title}</p>
            <p className="mt-2 max-w-[280px] text-sm text-neutral-400">{subtitle}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mx-auto mb-6 w-full max-w-md">
          <OnboardingDots total={4} current={idx} />
        </div>
        <div className="mx-auto w-full max-w-md">
          <button
            onClick={next}
            className="w-full rounded-full bg-white py-4 text-[15px] font-semibold text-ink-950 transition-transform active:scale-[0.98]">
            
            Continue
          </button>
        </div>
      </div>);

  }

  if (step === 5) {
    return <AuthScreen onSuccess={() => setStep(6)} onBack={() => setStep(4)} />;
  }

  return <Paywall onStart={goHome} onClose={goHome} />;
}