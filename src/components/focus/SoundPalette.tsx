import { LockIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ambientSounds } from '../../data/ambientSounds';
import { soundCategories } from '../../types/sound';
import { FeatureKey } from '../../utils/premium';

interface SoundPaletteProps {
  soundId: string;
  onChangeSound: (id: string) => void;
  onUpgrade?: (feature: FeatureKey) => void;
  pro: boolean;
  hideHeader?: boolean;
}

export function Equalizer({ active, className = '' }: {active: boolean;className?: string;}) {
  return (
    <span className={`flex h-3 items-end gap-[2px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) =>
      <span
        key={i}
        className={`w-[2.5px] rounded-full bg-current ${active ? 'eq-bar' : ''}`}
        style={{
          height: 12,
          animationDelay: `${i * 0.15}s`,
          transform: active ? undefined : 'scaleY(0.28)',
          opacity: active ? 1 : 0.5
        }} />

      )}
    </span>);
}

export function SoundPalette({ soundId, onChangeSound, onUpgrade, pro, hideHeader }: SoundPaletteProps) {
  const selected = ambientSounds.find((s) => s.id === soundId) ?? ambientSounds[0];
  const SelectedIcon = selected.icon;
  const selectedLocked = selected.premium && !pro;

  return (
    <div className={hideHeader ? '' : 'mt-8'}>
      {!hideHeader &&
      <div className="mb-3 flex items-end justify-between">
        <p className="text-sm font-semibold text-white">Focus Sound</p>
        <span className="text-[11px] font-medium text-neutral-500">
          {pro ? 'Pro library unlocked' : '3 free sounds'}
        </span>
      </div>
      }

      {/* Now-selected hero */}
      <div className="glass-strong relative overflow-hidden rounded-2xl p-4">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 85% -20%, ${selected.accent}33, transparent 65%)` }} />
        
        <div className="relative flex items-center gap-4">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(140deg, ${selected.accent}, ${selected.accent}66)`
            }}>
            <SelectedIcon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-semibold text-white">{selected.name}</p>
              {selected.premium &&
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ember-300">
                  Pro
                </span>
              }
            </div>
            <p className="mt-0.5 truncate text-xs text-neutral-400">{selected.description}</p>
          </div>
          <span style={{ color: selected.accent }}>
            <Equalizer active={!selectedLocked} />
          </span>
        </div>
      </div>

      {/* Grouped palette */}
      {soundCategories.map((cat, catIndex) => {
        const sounds = ambientSounds.filter((s) => s.category === cat.id);
        return (
          <div key={cat.id} className="mt-6">
            <div className="mb-2.5 flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{cat.label}</p>
              <span className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {sounds.map((s, i) => {
                const Icon = s.icon;
                const isSelected = s.id === soundId;
                const locked = s.premium && !pro;
                return (
                  <motion.button
                    key={s.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (catIndex * 0.03) + i * 0.02, duration: 0.25 }}
                    onClick={() => {
                      if (locked) {
                        onUpgrade?.('premiumSounds');
                        return;
                      }
                      onChangeSound(s.id);
                    }}
                    aria-pressed={isSelected}
                    className={`group relative overflow-hidden rounded-2xl p-3 text-left transition-colors ${
                    isSelected ? 'glass-strong' : 'glass-inset hover:bg-white/[0.07]'}`
                    }
                    style={
                    isSelected ?
                    { borderColor: s.accent } :
                    undefined
                    }>
                    
                    <div
                      className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full blur-2xl transition-opacity"
                      style={{ background: s.accent, opacity: isSelected ? 0.35 : locked ? 0.05 : 0.12 }} />
                    
                    <div className="relative flex items-start justify-between">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          background: `${s.accent}22`,
                          color: locked ? '#6b7280' : s.accent
                        }}>
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      {locked ?
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                          <LockIcon className="h-3 w-3 text-neutral-400" />
                        </span> :
                      isSelected ?
                      <span style={{ color: s.accent }}>
                          <Equalizer active />
                        </span> :

                      <span className="h-5 w-5 rounded-full border border-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                      }
                    </div>
                    <p className={`relative mt-3 truncate text-sm font-medium ${locked ? 'text-neutral-500' : 'text-white'}`}>
                      {s.name}
                    </p>
                    <p className={`relative mt-0.5 truncate text-[11px] ${locked ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      {locked ? 'Pro sound' : s.description}
                    </p>
                  </motion.button>);

              })}
            </div>
          </div>);

      })}
    </div>);
}
