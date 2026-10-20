export type AvatarVariant = 'pixel' | 'bauhaus' | 'ring' | 'beam' | 'sunset' | 'marble' | 'geometric' | 'abstract';

export interface AvatarPreset {
  id: string;
  name: string;
  variant: AvatarVariant;
  seed: string;
  colors: string[];
}

// A warm, cohesive palette shared across all presets so avatars feel native.
export const avatarPalette = ['#fb923c', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24'];

interface PresetDef {
  id: string;
  name: string;
  variant: AvatarVariant;
  seed: string;
  colors?: string[];
}

const defs: PresetDef[] = [
  { id: 'beam-ember', name: 'Ember', variant: 'beam', seed: 'cadence-ember' },
  { id: 'beam-sky', name: 'Tide', variant: 'beam', seed: 'cadence-tide', colors: ['#38bdf8', '#a78bfa', '#121b29'] },
  { id: 'beam-violet', name: 'Dusk', variant: 'beam', seed: 'cadence-dusk', colors: ['#a78bfa', '#fbbf24', '#121b29'] },
  { id: 'beam-mint', name: 'Mint', variant: 'beam', seed: 'cadence-mint', colors: ['#34d399', '#38bdf8', '#121b29'] },
  { id: 'marble-ember', name: 'Flare', variant: 'marble', seed: 'cadence-flare' },
  { id: 'marble-sky', name: 'Lagoon', variant: 'marble', seed: 'cadence-lagoon', colors: ['#38bdf8', '#34d399', '#fbbf24'] },
  { id: 'sunset-ember', name: 'Sunset', variant: 'sunset', seed: 'cadence-sunset' },
  { id: 'sunset-rose', name: 'Blush', variant: 'sunset', seed: 'cadence-blush', colors: ['#fb923c', '#f43f5e', '#a78bfa'] },
  { id: 'bauhaus-violet', name: 'Bauhaus', variant: 'bauhaus', seed: 'cadence-bauhaus' },
  { id: 'ring-sky', name: 'Halo', variant: 'ring', seed: 'cadence-halo', colors: ['#38bdf8', '#a78bfa', '#121b29'] },
  { id: 'geometric-mint', name: 'Prism', variant: 'geometric', seed: 'cadence-prism' },
  { id: 'abstract-magma', name: 'Magma', variant: 'abstract', seed: 'cadence-magma', colors: ['#fb923c', '#fbbf24', '#121b29'] }
];

export const avatarPresets: AvatarPreset[] = defs.map((d) => ({
  id: d.id,
  name: d.name,
  variant: d.variant,
  seed: d.seed,
  colors: d.colors ?? avatarPalette
}));

export const defaultAvatarId = 'beam-ember';
export const PRESET_PREFIX = 'preset:';

export function presetAvatarValue(id: string): string {
  return `${PRESET_PREFIX}${id}`;
}

export function findAvatar(id: string): AvatarPreset {
  return avatarPresets.find((a) => a.id === id) ?? avatarPresets[0];
}

export function isPresetAvatar(id: string): boolean {
  return avatarPresets.some((a) => a.id === id);
}

// A stored avatar is either a preset token ("preset:<id>") or a legacy
// path/data-URL. Resolve it to whichever the renderer should use.
export function resolveAvatar(value: string | undefined): { preset: AvatarPreset | null; src: string | null } {
  const v = (value ?? '').trim();
  if (v.startsWith(PRESET_PREFIX)) {
    const id = v.slice(PRESET_PREFIX.length);
    return { preset: isPresetAvatar(id) ? findAvatar(id) : findAvatar(defaultAvatarId), src: null };
  }
  if (v.length > 0) return { preset: null, src: v };
  return { preset: findAvatar(defaultAvatarId), src: null };
}
