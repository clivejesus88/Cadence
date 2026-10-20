import { useEffect, useRef, useState } from 'react';
import { XIcon, SparklesIcon, ShieldCheckIcon, LineChartIcon, PaletteIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { runSync, scheduleSync } from '../../db/sync';

interface PaywallProps {
  onStart: () => void;
  onClose: () => void;
}

const HERO_IMAGE_URL = "/2db10ed4-907b-405f-a887-1dfb58489242.jpg";

const benefits = [
{ icon: SparklesIcon, title: 'Unlimited custom sessions', desc: 'Create any timer length for any subject.', bg: '#0ea5e9' },
{ icon: ShieldCheckIcon, title: 'Advanced distraction blocking', desc: 'Block by schedule, app, or website—automatically.', bg: '#059669' },
{ icon: LineChartIcon, title: 'Deeper insights', desc: 'See patterns across months, not just weeks.', bg: '#8b5cf6' },
{ icon: PaletteIcon, title: 'Premium focus sounds', desc: 'Unlock the full library of ambient sounds for deep focus.', bg: '#f59e0b' }];


export function Paywall({ onClose }: PaywallProps) {
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [loading, setLoading] = useState(false);
  const { profile } = useSettings();
  const { user } = useAuth();
  const isPro = profile.plan === 'pro';

  const displayName = user ? profile.name || user.email?.split('@')[0] || 'Student' : 'Guest';
  const nameParts = displayName.trim().split(/\s+/);
  const signature = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.` : displayName;

  const isProRef = useRef(isPro);
  useEffect(() => {
    isProRef.current = isPro;
  }, [isPro]);

  // After returning from PayPal checkout, keep pulling until the webhook flips
  // us to Pro — the activation event can land a moment after the redirect.
  useEffect(() => {
    if (!isSupabaseConfigured || isProRef.current) return;
    if (new URLSearchParams(window.location.search).get('paywall') !== '1') return;
    let attempts = 0;
    const maxAttempts = 12;
    let timer = 0;
    const tick = () => {
      if (isProRef.current || attempts >= maxAttempts) {
        window.clearInterval(timer);
        return;
      }
      attempts += 1;
      void runSync();
    };
    timer = window.setInterval(tick, 2500);
    tick();
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const refresh = () => scheduleSync(300);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);

  const handleStart = async () => {
    if (loading) return;
    if (!isSupabaseConfigured || !supabase) {
      toast('Checkout is not configured yet.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paypal-create-subscription', {
        body: { plan, redirectUrl: `${window.location.origin}/?paywall=1` }
      });
      if (error || !data?.url) {
        toast('Could not start the checkout right now.');
        setLoading(false);
        return;
      }
      window.location.href = data.url as string;
    } catch {
      toast('Could not start the checkout right now.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={HERO_IMAGE_URL}
          alt=""
          className="h-full w-full scale-110 object-cover object-bottom blur-2xl" />
        
        <div className="absolute inset-0 bg-ink-950/50" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-ember-600/35 via-ember-500/10 to-transparent" />
      </div>

      <button
        onClick={onClose}
        aria-label="Skip Pro"
        className="glass-inset hit-slop absolute right-5 top-[max(1.5rem,env(safe-area-inset-top))] z-20 flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:opacity-70 active:scale-95">
        
        <XIcon className="h-5 w-5" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-40 pt-14 sm:px-6">
        <div className="mx-auto w-60 -rotate-6 rounded-2xl bg-[#f3efe6] px-4 pb-4 pt-3 shadow-2xl">
          <div className="flex justify-between">
            {Array.from({ length: 9 }).map((_, i) =>
            <span key={i} className="h-1 w-1 rounded-full bg-black/15" />
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink-950">
              Focus Pass{' '}
              <span className="ml-1 rounded bg-ember-500/15 px-1 py-0.5 text-[9px] font-bold text-ember-600">PRO</span>
            </p>
            <p className="font-display text-sm italic text-ink-950/50">Cadence</p>
          </div>
          <div className="mt-3 space-y-2 text-left">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Student</p>
              <p className="truncate text-xs font-medium text-ink-950/80">{displayName}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Focus goal</p>
              <p className="text-xs font-medium text-ink-950/80">Deep Work</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Signed</p>
              <p className="font-display text-sm italic text-ink-950/70">{signature}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-between">
            {Array.from({ length: 9 }).map((_, i) =>
            <span key={i} className="h-1 w-1 rounded-full bg-black/15" />
            )}
          </div>
        </div>

        <p className="mt-6 text-center font-display text-3xl tracking-tight text-white sm:text-4xl">
          Cadence <span className="italic text-ember-400">Pro</span>
        </p>
        <p className="mx-auto mt-2 max-w-[240px] text-center text-sm leading-6 text-neutral-400">
          Launch special is on!
          <br />
          Unlock your best study habits now!
        </p>

        {!isPro &&
        <div className="mt-7 space-y-3">
          <div className="relative">
            <span className="absolute -top-2.5 left-4 z-10 rounded-full bg-gradient-to-r from-ember-500 to-orange-600 px-2.5 py-1 text-[10px] font-bold text-white">
              Save 40%
            </span>
            <button
              onClick={() => setPlan('yearly')}
              aria-pressed={plan === 'yearly'}
              style={plan === 'yearly' ? { borderColor: 'rgba(255,255,255,0.85)' } : undefined}
              className="glass-strong w-full rounded-2xl px-4 py-4 text-left transition-all active:scale-[0.99]">
              
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-white">Yearly</p>
                <div className="flex items-center gap-2.5">
                  <p className="text-xs text-neutral-300">$3.99/mo</p>
                  {plan === 'yearly' ?
                  <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 border-white">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span> :

                  <span className="h-[18px] w-[18px] flex-shrink-0 rounded-full border-2 border-white/30" />
                  }
                </div>
              </div>
              <p className="mt-1 text-xs text-neutral-400">$47.99/yr</p>
            </button>
          </div>

          <button
            onClick={() => setPlan('monthly')}
            aria-pressed={plan === 'monthly'}
            style={plan === 'monthly' ? { borderColor: 'rgba(255,255,255,0.85)' } : undefined}
            className="glass-strong w-full rounded-2xl px-4 py-4 text-left transition-all active:scale-[0.99]">
            
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-white">Monthly</p>
              <div className="flex items-center gap-2.5">
                <p className="text-xs text-neutral-300">$6.99/mo</p>
                {plan === 'monthly' ?
                <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 border-white">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span> :

                <span className="h-[18px] w-[18px] flex-shrink-0 rounded-full border-2 border-white/30" />
                }
              </div>
            </div>
          </button>
        </div>
        }

        {isPro &&
        <div className="glass-strong mt-7 rounded-2xl px-4 py-5 text-center">
          <ShieldCheckIcon className="mx-auto h-8 w-8 text-ember-400" />
          <p className="mt-2 text-base font-bold text-white">You're on Cadence Pro</p>
          <p className="mx-auto mt-1 max-w-[280px] text-xs leading-5 text-neutral-400">
            Thanks for being a member — the full sound library and advanced blocking rules are unlocked.
          </p>
        </div>
        }

        <section className="mt-8">
          <p className="text-lg font-bold text-white">PRO Benefits</p>
          <div className="mt-4 space-y-5">
            {benefits.map(({ icon: Icon, title, desc, bg }) =>
            <div key={title} className="flex items-start gap-3">
                <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: bg }}>
                
                  <Icon className="h-[18px] w-[18px] text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-neutral-400">{desc}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-10 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <button
            onClick={isPro ? onClose : handleStart}
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.995] disabled:opacity-60">
            {isPro ? 'Back to Cadence' : plan === 'yearly' ? 'Start Pro • Yearly' : 'Start Pro • Monthly'}
          </button>
          {!isPro && (
            <button onClick={onClose} className="hit-slop mt-3 w-full py-1 text-center text-sm text-neutral-400 transition-colors hover:text-neutral-300 active:text-white">
              Not now
            </button>
          )}
        </div>
      </div>
    </div>);

}