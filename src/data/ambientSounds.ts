import {
  CloudRainIcon,
  Music2Icon,
  TreePineIcon,
  WavesIcon,
  CoffeeIcon,
  MoonStarIcon,
  WindIcon,
  CloudLightningIcon,
  FlameIcon,
  AudioLinesIcon,
  MoonIcon,
  PianoIcon,
  RadioIcon
} from 'lucide-react';
import { AmbientSound } from '../types/sound';

export const ambientSounds: AmbientSound[] = [
// Focus — utility soundscapes
{ id: 'silence', name: 'Deep Silence', description: 'No sound, pure focus', icon: MoonStarIcon, premium: false, category: 'focus', accent: '#94a3b8' },
{ id: 'white', name: 'White Noise', description: 'Even coverage to mask distraction', icon: AudioLinesIcon, premium: false, category: 'focus', accent: '#e2e8f0' },
{ id: 'brown', name: 'Brown Noise', description: 'Warm low-end hum', icon: RadioIcon, premium: true, category: 'focus', accent: '#b45309' },

// Nature
{ id: 'rain', name: 'Rainfall', description: 'Steady rain on a window', icon: CloudRainIcon, premium: false, category: 'nature', accent: '#38bdf8' },
{ id: 'ocean', name: 'Ocean Waves', description: 'Slow rolling tide', icon: WavesIcon, premium: true, category: 'nature', accent: '#06b6d4' },
{ id: 'forest', name: 'Forest Morning', description: 'Birdsong & light wind', icon: TreePineIcon, premium: true, category: 'nature', accent: '#22c55e' },
{ id: 'wind', name: 'Highland Wind', description: 'Gusts across open fields', icon: WindIcon, premium: true, category: 'nature', accent: '#64748b' },
{ id: 'thunder', name: 'Thunderstorm', description: 'Distant thunder & heavy rain', icon: CloudLightningIcon, premium: true, category: 'nature', accent: '#6366f1' },

// Ambience
{ id: 'cafe', name: 'Cafe Ambience', description: 'Soft chatter & espresso', icon: CoffeeIcon, premium: true, category: 'ambience', accent: '#f59e0b' },
{ id: 'fireplace', name: 'Fireplace', description: 'Crackling logs & warmth', icon: FlameIcon, premium: true, category: 'ambience', accent: '#ef4444' },
{ id: 'night', name: 'Night Fall', description: 'Crickets & calm darkness', icon: MoonIcon, premium: true, category: 'ambience', accent: '#8b5cf6' },

// Music
{ id: 'lofi', name: 'Lo-fi Beats', description: 'Chill instrumental loops', icon: Music2Icon, premium: true, category: 'music', accent: '#f472b6' },
{ id: 'piano', name: 'Soft Piano', description: 'Gentle keys, slow tempo', icon: PianoIcon, premium: true, category: 'music', accent: '#fbbf24' }];
