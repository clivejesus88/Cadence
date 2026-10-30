import { sanitizeAvatarUrl } from '../utils/sanitize';

export type AvatarVariant = 'pixel' | 'bauhaus' | 'ring' | 'beam' | 'sunset' | 'marble' | 'geometric' | 'abstract';

export interface AvatarPreset {
  id: string;
  name: string;
  seed: string;
  style: 'adventurer' | 'boring';
  variant?: AvatarVariant;
  colors?: string[];
}

const characterSeeds = [
  { id: 'adventurer-ember', name: 'Ember', seed: 'cadence-ember' },
  { id: 'adventurer-mika', name: 'Mika', seed: 'cadence-mika' },
  { id: 'adventurer-sage', name: 'Sage', seed: 'cadence-sage' },
  { id: 'adventurer-river', name: 'River', seed: 'cadence-river' },
  { id: 'adventurer-sunny', name: 'Sunny', seed: 'cadence-sunny' },
  { id: 'adventurer-ash', name: 'Ash', seed: 'cadence-ash' },
  { id: 'adventurer-indigo', name: 'Indigo', seed: 'cadence-indigo' },
  { id: 'adventurer-jules', name: 'Jules', seed: 'cadence-jules' },
  { id: 'adventurer-remy', name: 'Remy', seed: 'cadence-remy' },
  { id: 'adventurer-skye', name: 'Skye', seed: 'cadence-skye' },
  { id: 'adventurer-alex', name: 'Alex', seed: 'cadence-alex' },
  { id: 'adventurer-noor', name: 'Noor', seed: 'cadence-noor' }
];

export const avatarPresets: AvatarPreset[] = characterSeeds.map((preset) => ({
  ...preset,
  style: 'adventurer'
}));

const legacyAvatarPresets: AvatarPreset[] = [
  { id: 'beam-ember', name: 'Ember', variant: 'beam', seed: 'cadence-ember', style: 'boring', colors: ['#e5e7eb', '#334155', '#fb923c', '#0b0d10'] },
  { id: 'beam-sky', name: 'Tide', variant: 'beam', seed: 'cadence-tide', style: 'boring', colors: ['#cbd5e1', '#475569', '#94a3b8', '#0b0d10'] },
  { id: 'beam-violet', name: 'Dusk', variant: 'beam', seed: 'cadence-dusk', style: 'boring', colors: ['#d1d5db', '#1f2937', '#6b7280', '#0b0d10'] },
  { id: 'beam-mint', name: 'Mint', variant: 'beam', seed: 'cadence-mint', style: 'boring', colors: ['#e2e8f0', '#374151', '#9ca3af', '#0b0d10'] },
  { id: 'marble-ember', name: 'Flare', variant: 'marble', seed: 'cadence-flare', style: 'boring', colors: ['#f1f5f9', '#475569', '#111827'] },
  { id: 'marble-sky', name: 'Lagoon', variant: 'marble', seed: 'cadence-lagoon', style: 'boring', colors: ['#e5e7eb', '#64748b', '#1f2937'] },
  { id: 'sunset-ember', name: 'Sunset', variant: 'sunset', seed: 'cadence-sunset', style: 'boring', colors: ['#f1f5f9', '#6b7280', '#fb923c'] },
  { id: 'sunset-rose', name: 'Blush', variant: 'sunset', seed: 'cadence-blush', style: 'boring', colors: ['#e5e7eb', '#94a3b8', '#334155'] },
  { id: 'bauhaus-violet', name: 'Bauhaus', variant: 'bauhaus', seed: 'cadence-bauhaus', style: 'boring', colors: ['#e5e7eb', '#475569', '#111827', '#fb923c'] },
  { id: 'ring-sky', name: 'Halo', variant: 'ring', seed: 'cadence-halo', style: 'boring', colors: ['#cbd5e1', '#334155', '#0f172a'] },
  { id: 'geometric-mint', name: 'Prism', variant: 'geometric', seed: 'cadence-prism', style: 'boring', colors: ['#e2e8f0', '#64748b', '#1f2937', '#fb923c'] },
  { id: 'abstract-magma', name: 'Magma', variant: 'abstract', seed: 'cadence-magma', style: 'boring', colors: ['#e5e7eb', '#374151', '#fb923c', '#0b0d10'] }
];

export const defaultAvatarId = 'adventurer-ember';
export const PRESET_PREFIX = 'preset:';

export function presetAvatarValue(id: string): string {
  return `${PRESET_PREFIX}${id}`;
}

export function findAvatar(id: string): AvatarPreset {
  return avatarPresets.find((avatar) => avatar.id === id) ??
    legacyAvatarPresets.find((avatar) => avatar.id === id) ??
    avatarPresets[0];
}

export function isPresetAvatar(id: string): boolean {
  return avatarPresets.some((avatar) => avatar.id === id) ||
    legacyAvatarPresets.some((avatar) => avatar.id === id);
}

// Older installations may still have abstract preset tokens saved in profile data.
export function resolveAvatar(value: string | undefined): { preset: AvatarPreset | null; src: string | null } {
  const storedValue = (value ?? '').trim();
  if (storedValue.startsWith(PRESET_PREFIX)) {
    const id = storedValue.slice(PRESET_PREFIX.length);
    return { preset: findAvatar(id), src: null };
  }
  const safe = sanitizeAvatarUrl(storedValue);
  if (safe.length > 0) return { preset: null, src: safe };
  return { preset: findAvatar(defaultAvatarId), src: null };
}
