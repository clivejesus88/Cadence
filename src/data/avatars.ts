export type AvatarVariant = 'pixel' | 'bauhaus' | 'ring' | 'beam' | 'sunset' | 'marble' | 'geometric' | 'abstract';

export interface AvatarPreset {
  id: string;
  name: string;
  variant: AvatarVariant;
  seed: string;
  colors: string[];
}

// A cool, near-monochrome palette so avatars feel native to the dark UI.
// Muted slate/graphite tones with a single warm ember accent for life.
export const avatarPalette = ['#e5e7eb', '#64748b', '#1f2937', '#334155', '#fb923c'];

interface PresetDef {
  id: string;
  name: string;
  variant: AvatarVariant;
  seed: string;
  colors?: string[];
}

const defs: PresetDef[] = [
  { id: 'beam-ember', name: 'Ember', variant: 'beam', seed: 'cadence-ember', colors: ['#e5e7eb', '#334155', '#fb923c', '#0b0d10'] },
  { id: 'beam-sky', name: 'Tide', variant: 'beam', seed: 'cadence-tide', colors: ['#cbd5e1', '#475569', '#94a3b8', '#0b0d10'] },
  { id: 'beam-violet', name: 'Dusk', variant: 'beam', seed: 'cadence-dusk', colors: ['#d1d5db', '#1f2937', '#6b7280', '#0b0d10'] },
  { id: 'beam-mint', name: 'Mint', variant: 'beam', seed: 'cadence-mint', colors: ['#e2e8f0', '#374151', '#9ca3af', '#0b0d10'] },
  { id: 'marble-ember', name: 'Flare', variant: 'marble', seed: 'cadence-flare', colors: ['#f1f5f9', '#475569', '#111827'] },
  { id: 'marble-sky', name: 'Lagoon', variant: 'marble', seed: 'cadence-lagoon', colors: ['#e5e7eb', '#64748b', '#1f2937'] },
  { id: 'sunset-ember', name: 'Sunset', variant: 'sunset', seed: 'cadence-sunset', colors: ['#f1f5f9', '#6b7280', '#fb923c'] },
  { id: 'sunset-rose', name: 'Blush', variant: 'sunset', seed: 'cadence-blush', colors: ['#e5e7eb', '#94a3b8', '#334155'] },
  { id: 'bauhaus-violet', name: 'Bauhaus', variant: 'bauhaus', seed: 'cadence-bauhaus', colors: ['#e5e7eb', '#475569', '#111827', '#fb923c'] },
  { id: 'ring-sky', name: 'Halo', variant: 'ring', seed: 'cadence-halo', colors: ['#cbd5e1', '#334155', '#0f172a'] },
  { id: 'geometric-mint', name: 'Prism', variant: 'geometric', seed: 'cadence-prism', colors: ['#e2e8f0', '#64748b', '#1f2937', '#fb923c'] },
  { id: 'abstract-magma', name: 'Magma', variant: 'abstract', seed: 'cadence-magma', colors: ['#e5e7eb', '#374151', '#fb923c', '#0b0d10'] }
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
