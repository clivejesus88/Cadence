import React, { useState } from 'react';
import { XIcon, SparklesIcon, PaletteIcon, LineChartIcon, ShieldCheckIcon } from 'lucide-react';

interface PaywallProps {
  onStart: () => void;
  onClose: () => void;
}

const HERO_IMAGE_URL = "/2db10ed4-907b-405f-a887-1dfb58489242.jpg";

const benefits = [
{ icon: SparklesIcon, title: 'Unlimited custom sessions', desc: 'Create any timer length for any subject.', bg: '#0ea5e9' },
{ icon: ShieldCheckIcon, title: 'Advanced blocking rules', desc: 'Block by schedule, app, or website.', bg: '#059669' },
{ icon: LineChartIcon, title: 'Deeper insights', desc: 'See patterns across months, not just weeks.', bg: '#8b5cf6' },
{ icon: PaletteIcon, title: 'Premium soundscapes', desc: 'Unlock every focus sound in the library.', bg: '#f59e0b' }];


export function Paywall({ onStart, onClose }: PaywallProps) {
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
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
        className="glass-inset absolute right-5 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity hover:opacity-70">
        
        <XIcon className="h-5 w-5" />
      </button>

      <div className="relative z-10 px-6 pb-36 pt-16">
        <div className="mx-auto w-60 -rotate-6 rounded-2xl bg-[#f3efe6] px-4 pb-4 pt-3 shadow-2xl">
          <div className="flex justify-between">
            {Array.from({ length: 9 }).map((_, i) =>
            <span key={i} className="h-1 w-1 rounded-full bg-black/15" />
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink-950">
              Focus Pass{' '}
              <span className="ml-1 rounded bg-ember-500/15 px-1 py-0.5 text-[9px] font-bold text-ember-600">NEW</span>
            </p>
            <p className="font-display text-sm italic text-ink-950/50">Cadence</p>
          </div>
          <div className="mt-3 space-y-2 text-left">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Student</p>
              <p className="text-xs font-medium text-ink-950/80">Alex</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Focus goal</p>
              <p className="text-xs font-medium text-ink-950/80">Deep Work</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-950/40">Signed</p>
              <p className="font-display text-sm italic text-ink-950/70">Alex R.</p>
            </div>
          </div>
          <div className="mt-3 flex justify-between">
            {Array.from({ length: 9 }).map((_, i) =>
            <span key={i} className="h-1 w-1 rounded-full bg-black/15" />
            )}
          </div>
        </div>

        <p className="mt-6 text-center font-display text-3xl tracking-tight text-white">
          Cadence <span className="italic text-ember-400">pro</span>
        </p>
        <p className="mx-auto mt-2 max-w-[240px] text-center text-sm leading-6 text-neutral-400">
          Launch special is on!
          <br />
          Unlock your best study habits now!
        </p>

        <div className="mt-7 space-y-3">
          <div className="relative">
            <span className="absolute -top-2.5 left-4 z-10 rounded-full bg-gradient-to-r from-ember-500 to-orange-600 px-2.5 py-1 text-[10px] font-bold text-white">
              Save 40%
            </span>
            <button
              onClick={() => setPlan('yearly')}
              aria-pressed={plan === 'yearly'}
              style={plan === 'yearly' ? { borderColor: 'rgba(255,255,255,0.85)' } : undefined}
              className="glass-strong w-full rounded-2xl px-4 py-4 text-left transition-colors">
              
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
            className="glass-strong w-full rounded-2xl px-4 py-4 text-left transition-colors">
            
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

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-6 pb-8 pt-10">
        <button
          onClick={onStart}
          className="w-full rounded-full bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]">
          
          Start Cadence
        </button>
      </div>
    </div>);

}