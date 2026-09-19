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
  const [step, setStep] = useState(() => (searchParams.get('paywall') ? 6 : 0)); // 0 splash, 1-4 features, 5 auth, 6 paywall
  const navigate = useNavigate();
  const { isConfigured, user } = useAuth();

  useEffect(() => {
    if (isConfigured && user && !searchParams.get('paywall')) {
      navigate('/app/home', { replace: true });
    }
  }, [isConfigured, user, navigate, searchParams]);

  const goHome = () => navigate('/app/home', { replace: true });
  const next = () => setStep((s) => Math.min(s + 1, 6));

  if (step === 0) {
    return (
      <div className="relative w-full min-h-screen flex flex-col justify-end bg-ink-950">
        <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-ink-950/10" />
        <div className="relative z-10 px-6 pb-10 flex flex-col items-center text-center">
          <p className="font-display italic text-4xl text-white">Cadence</p>
          <p className="text-neutral-300 text-sm mt-2">Focus that fits your rhythm.</p>
          <button
            onClick={next}
            className="mt-8 w-full py-4 rounded-full font-semibold text-[15px] bg-white text-ink-950 active:scale-[0.98] transition-transform">
            
            Get Started
          </button>
        </div>
      </div>);

  }

  if (step >= 1 && step <= 4) {
    const idx = step - 1;
    const { Visual, title, subtitle } = features[idx];
    return (
      <div className="relative w-full min-h-screen flex flex-col px-6 pt-6 pb-8 bg-ink-950 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <img src={HERO_IMAGE_URL} alt="" className="h-full w-full scale-110 object-cover blur-2xl" />
          <div className="absolute inset-0 bg-ink-950/45" />
          <div className="absolute -top-10 -right-16 h-72 w-72 rounded-full bg-ember-500/25 blur-[100px]" />
          <div className="absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-sky-500/15 blur-[100px]" />
        </div>
        <div className="flex justify-end">
          <button onClick={() => setStep(isConfigured ? 5 : 6)} className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
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
            className="flex-1 flex flex-col items-center justify-center text-center">
            
            <Visual />
            <p className="font-display text-2xl text-white mt-8">{title}</p>
            <p className="text-neutral-400 text-sm mt-2 max-w-[280px]">{subtitle}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mb-6">
          <OnboardingDots total={4} current={idx} />
        </div>
        <button
          onClick={next}
          className="w-full py-4 rounded-full font-semibold text-[15px] bg-white text-ink-950 active:scale-[0.98] transition-transform">
          
          Continue
        </button>
      </div>);

  }

  if (step === 5 && isConfigured) {
    return <AuthScreen onSuccess={() => setStep(6)} onBack={() => setStep(4)} />;
  }

  return <Paywall onStart={goHome} onClose={goHome} />;
}