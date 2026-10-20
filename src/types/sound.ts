import type { LucideIcon } from 'lucide-react';

export type SoundCategoryId = 'focus' | 'nature' | 'ambience' | 'music';

export interface SoundCategory {
  id: SoundCategoryId;
  label: string;
}

export interface AmbientSound {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  premium: boolean;
  category: SoundCategoryId;
  accent: string;
  // Short, factual trait line — tempo, lyrics, or psychoacoustic cue. Never an
  // endorsement: these describe the sound, they don't claim clinical approval.
  tag?: string;
}

export const soundCategories: SoundCategory[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'nature', label: 'Nature' },
  { id: 'ambience', label: 'Ambience' },
  { id: 'music', label: 'Music' }
];
