export type AvatarVariant = 'pixel' | 'bauhaus' | 'ring' | 'beam' | 'sunset' | 'marble' | 'geometric' | 'abstract';

export interface AvatarPreset {
  id: string;
  name: string;
  colors: string[];
}

// A warm, cohesive palette shared across all presets so avatars feel native.
export const avatarPalette = ['#fb923c', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24'];

const variants: AvatarVariant[] = ['marble', 'beam', 'sunset', 'bauhaus', 'ring', 'geometric', 'abstract', 'pixel'];

export const avatarVariants = variants;

export const avatarPresets: AvatarPreset[] = variants.map((variant) => ({
  id: variant,
  name: variant.charAt(0).toUpperCase() + variant.slice(1),
  colors: avatarPalette
}));

export const defaultAvatarId: AvatarVariant = 'marble';
export const PRESET_PREFIX = 'preset:';

export function presetAvatarValue(id: string): string {
  return `${PRESET_PREFIX}${id}`;
}

export function findAvatar(id: string): AvatarPreset {
  return avatarPresets.find((a) => a.id === id) ?? avatarPresets[0];
}

export function isPresetAvatar(id: string): boolean {
  return variants.includes(id as AvatarVariant);
}

// A stored avatar is either a preset token ("preset:<variant>") or a legacy
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
