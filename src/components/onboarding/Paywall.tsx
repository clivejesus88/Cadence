import { useEffect, useRef, useState } from 'react';
import { TimerIcon, ShieldCheckIcon, LineChartIcon, PaletteIcon } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { runSync, scheduleSync } from '../../db/sync';
import { notifyError } from '../../utils/notify';
import { consume, formatRetry, CHECKOUT_LIMIT } from '../../utils/rateLimit';

interface PaywallProps {
  onStart: () => void;
  onClose: () => void;
}

const HERO_BLUR_URL = "/hero-blur.jpg";

const benefits = [
{ icon: TimerIcon, title: 'Unlimited custom sessions', desc: 'Create any timer length for any subject.', bg: '#0ea5e9' },
{ icon: ShieldCheckIcon, title: 'Advanced distraction plan', desc: 'Plan what to avoid by schedule, app, or website.', bg: '#059669' },
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
      notifyError('Checkout isn’t available yet', 'Payments need a final configuration step. Everything else is ready to use.');
      return;
    }
    setLoading(true);
    try {
      const limit = consume('checkout', CHECKOUT_LIMIT);
      if (!limit.allowed) {
        notifyError('Please wait a moment', `Too many checkout attempts. Try again in ${formatRetry(limit.retryAfterMs)}.`);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('paypal-create-subscription', {
        body: { plan, redirectUrl: `${window.location.origin}/?paywall=1` }
      });
      if (error || !data?.url) {
        notifyError('Could not start checkout', 'Please try again in a moment.');
        setLoading(false);
        return;
      }
      window.location.href = data.url as string;
    } catch {
      notifyError('Could not start checkout', 'Please try again in a moment.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-ink-950">
      {/* Static, non-scrolling background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={HERO_BLUR_URL}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="h-full w-full scale-110 object-cover object-bottom" />

        <div className="absolute inset-0 bg-ink-950/50" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-ember-600/35 via-ember-500/10 to-transparent" />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.75rem)] sm:px-6">
          <div className="mx-auto w-full max-w-[15rem] -rotate-6 rounded-2xl bg-[#f3efe6] px-4 pb-4 pt-3 shadow-2xl">
            <div className="flex justify-between">
              {Array.from({ length: 9 }).map((_, i) =>
              <span key={i} className="h-1 w-1 rounded-full bg-black/15" />
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-ink-950">
                Focus Pass{' '}
                <span className="ml-1 rounded bg-ember-500/15 px-1 py-0.5 text-[9px] font-bold text-ember-600">PRO</span>
              </p>
              <p className="shrink-0 font-display text-sm italic text-ink-950/50">Cadence</p>
            </div>
            <div className="mt-3 space-y-2 text-left">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Student</p>
                <p className="truncate text-xs font-medium text-ink-950/80">{displayName}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Focus goal</p>
                <p className="text-xs font-medium text-ink-950/80">Deep Work</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Signed</p>
                <p className="truncate font-display text-sm italic text-ink-950/70">{signature}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between">
              {Array.from({ length: 9 }).map((_, i) =>
              <span key={i} className="h-1 w-1 rounded-full bg-black/15" />
              )}
            </div>
          </div>

          <p className="mt-6 text-center font-display text-[28px] leading-tight tracking-tight text-white sm:text-4xl">
            Cadence <span className="italic text-ember-400">Pro</span>
          </p>
          <p className="mx-auto mt-2 max-w-[260px] text-center text-sm leading-6 text-neutral-400">
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

                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-bold text-white">Yearly</p>
                  <div className="flex shrink-0 items-center gap-2.5">
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

              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-bold text-white">Monthly</p>
                <div className="flex shrink-0 items-center gap-2.5">
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
              Thanks for being a member — the full sound library and the advanced distraction plan are unlocked.
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
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs leading-5 text-neutral-400">{desc}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Action bar — part of the flex column, so it never covers content */}
      <div className="relative z-20 shrink-0 border-t border-white/5 bg-ink-950/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <button
            onClick={isPro ? onClose : handleStart}
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.995] disabled:opacity-60">
            {isPro ? 'Back to Cadence' : plan === 'yearly' ? 'Start Pro • Yearly' : 'Start Pro • Monthly'}
          </button>
          {!isPro && (
            <button onClick={onClose} className="hit-slop mt-2 w-full py-1.5 text-center text-sm text-neutral-400 transition-colors hover:text-neutral-300 active:text-white">
              Not now
            </button>
          )}
          {!isPro && (
            <p className="mt-1 text-center text-[11px] leading-4 text-neutral-500">
              Renews automatically until cancelled. By subscribing you agree to our{' '}
              <a href="/terms" className="underline decoration-neutral-600 underline-offset-2 hover:text-neutral-300">Terms</a>{' '}
              and{' '}
              <a href="/privacy" className="underline decoration-neutral-600 underline-offset-2 hover:text-neutral-300">Privacy Policy</a>.
            </p>
          )}
        </div>
      </div>
    </div>);

}
