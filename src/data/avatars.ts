export type AvatarShape = 'orb' | 'ring' | 'prism' | 'mesh' | 'bloom';

export interface AvatarPreset {
  id: string;
  name: string;
  gradient: [string, string];
  glow: string;
  shape: AvatarShape;
}

// All palettes are drawn from the app's existing accent family (ember, sky,
// violet, emerald) so avatars feel native rather than imported.
export const avatarPresets: AvatarPreset[] = [
  { id: 'ember-orb', name: 'Ember', gradient: ['#fb923c', '#ea580c'], glow: '#fb923c', shape: 'orb' },
  { id: 'sky-orb', name: 'Tide', gradient: ['#38bdf8', '#0ea5e9'], glow: '#38bdf8', shape: 'orb' },
  { id: 'violet-orb', name: 'Dusk', gradient: ['#a78bfa', '#7c3aed'], glow: '#a78bfa', shape: 'orb' },
  { id: 'emerald-orb', name: 'Moss', gradient: ['#34d399', '#059669'], glow: '#34d399', shape: 'orb' },
  { id: 'gold-ring', name: 'Solstice', gradient: ['#fbbf24', '#f59e0b'], glow: '#fbbf24', shape: 'ring' },
  { id: 'sky-ring', name: 'Halo', gradient: ['#7dd3fc', '#38bdf8'], glow: '#7dd3fc', shape: 'ring' },
  { id: 'violet-ring', name: 'Orbit', gradient: ['#c4b5fd', '#8b5cf6'], glow: '#c4b5fd', shape: 'ring' },
  { id: 'rose-ring', name: 'Blush', gradient: ['#fda4af', '#f43f5e'], glow: '#fda4af', shape: 'ring' },
  { id: 'ember-prism', name: 'Shard', gradient: ['#fdba74', '#f97316'], glow: '#fdba74', shape: 'prism' },
  { id: 'sky-prism', name: 'Frost', gradient: ['#7dd3fc', '#0284c7'], glow: '#7dd3fc', shape: 'prism' },
  { id: 'violet-prism', name: 'Amethyst', gradient: ['#c4b5fd', '#6d28d9'], glow: '#c4b5fd', shape: 'prism' },
  { id: 'emerald-prism', name: 'Jade', gradient: ['#6ee7b7', '#047857'], glow: '#6ee7b7', shape: 'prism' },
  { id: 'ember-mesh', name: 'Signal', gradient: ['#fb923c', '#c2410c'], glow: '#fb923c', shape: 'mesh' },
  { id: 'sky-mesh', name: 'Pulse', gradient: ['#38bdf8', '#0369a1'], glow: '#38bdf8', shape: 'mesh' },
  { id: 'violet-mesh', name: 'Nebula', gradient: ['#a78bfa', '#5b21b6'], glow: '#a78bfa', shape: 'mesh' },
  { id: 'emerald-mesh', name: 'Aurora', gradient: ['#34d399', '#065f46'], glow: '#34d399', shape: 'mesh' },
  { id: 'ember-bloom', name: 'Flare', gradient: ['#fdba74', '#e11d48'], glow: '#fdba74', shape: 'bloom' },
  { id: 'sky-bloom', name: 'Lagoon', gradient: ['#7dd3fc', '#4f46e5'], glow: '#7dd3fc', shape: 'bloom' },
  { id: 'violet-bloom', name: 'Iris', gradient: ['#c4b5fd', '#db2777'], glow: '#c4b5fd', shape: 'bloom' },
  { id: 'emerald-bloom', name: 'Fern', gradient: ['#6ee7b7', '#0f766e'], glow: '#6ee7b7', shape: 'bloom' }
];

export const defaultAvatarId = 'ember-orb';
export const PRESET_PREFIX = 'preset:';

export function presetAvatarValue(id: string): string {
  return `${PRESET_PREFIX}${id}`;
}

export function findAvatar(id: string): AvatarPreset {
  return avatarPresets.find((a) => a.id === id) ?? avatarPresets[0];
}

// A stored avatar is either a preset token ("preset:<id>") or a legacy
// path/data-URL. Resolve it to whichever the renderer should use.
export function resolveAvatar(value: string | undefined): { preset: AvatarPreset | null; src: string | null } {
  const v = (value ?? '').trim();
  if (v.startsWith(PRESET_PREFIX)) return { preset: findAvatar(v.slice(PRESET_PREFIX.length)), src: null };
  if (v.length > 0) return { preset: null, src: v };
  return { preset: findAvatar(defaultAvatarId), src: null };
}
