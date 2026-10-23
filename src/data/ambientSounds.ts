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
  RadioIcon,
  GuitarIcon,
  ActivityIcon,
  DrumIcon
} from 'lucide-react';
import { AmbientSound } from '../types/sound';

export const ambientSounds: AmbientSound[] = [
// Focus — utility soundscapes
{ id: 'silence', name: 'Deep Silence', description: 'No sound, pure focus', icon: MoonStarIcon, premium: false, category: 'focus', accent: '#94a3b8' },
{ id: 'white', name: 'White Noise', description: 'Even coverage to mask distraction', icon: AudioLinesIcon, premium: false, category: 'focus', accent: '#e2e8f0', tag: 'Broadband · masks speech' },
{ id: 'brown', name: 'Brown Noise', description: 'Warm low-end hum', icon: RadioIcon, premium: true, category: 'focus', accent: '#b45309', tag: 'Low frequency · deep focus' },

// Nature
{ id: 'rain', name: 'Rainfall', description: 'Steady rain on a window', icon: CloudRainIcon, premium: false, category: 'nature', accent: '#38bdf8', tag: 'Steady · no lyrics' },
{ id: 'ocean', name: 'Ocean Waves', description: 'Slow rolling tide', icon: WavesIcon, premium: true, category: 'nature', accent: '#06b6d4', tag: 'Slow swell · ~0.1 Hz' },
{ id: 'forest', name: 'Forest Morning', description: 'Birdsong & light wind', icon: TreePineIcon, premium: true, category: 'nature', accent: '#22c55e' },
{ id: 'wind', name: 'Highland Wind', description: 'Gusts across open fields', icon: WindIcon, premium: true, category: 'nature', accent: '#64748b' },
{ id: 'thunder', name: 'Thunderstorm', description: 'Distant thunder & heavy rain', icon: CloudLightningIcon, premium: true, category: 'nature', accent: '#6366f1' },

// Ambience
{ id: 'cafe', name: 'Cafe Ambience', description: 'Soft chatter & espresso', icon: CoffeeIcon, premium: true, category: 'ambience', accent: '#f59e0b', tag: '74 dB murmur · steady' },
{ id: 'fireplace', name: 'Fireplace', description: 'Crackling logs & warmth', icon: FlameIcon, premium: true, category: 'ambience', accent: '#ef4444' },
{ id: 'night', name: 'Night Fall', description: 'Crickets & calm darkness', icon: MoonIcon, premium: true, category: 'ambience', accent: '#8b5cf6' },

// Music — soft classical & cinematic (free during launch)
{ id: 'classical', name: 'Classical Piano', description: 'Unhurried chamber harmony', icon: PianoIcon, premium: false, category: 'music', accent: '#fbbf24', tag: 'Soft · Bach & Satie' },
{ id: 'gymnopedie', name: 'Gymnopédie', description: 'Satie · weightless, slow piano', icon: PianoIcon, premium: false, category: 'music', accent: '#facc15', tag: 'Satie · public domain' },
{ id: 'moonlight', name: 'Moonlight Sonata', description: 'Beethoven · rolling triplets', icon: MoonIcon, premium: false, category: 'music', accent: '#93c5fd', tag: 'Beethoven · public domain' },
{ id: 'canon', name: 'Canon in D', description: 'Pachelbel · gentle arpeggios', icon: GuitarIcon, premium: false, category: 'music', accent: '#86efac', tag: 'Pachelbel · public domain' },
{ id: 'cinematic', name: 'Cinematic Piano', description: 'Emotional, repeating arpeggios', icon: PianoIcon, premium: false, category: 'music', accent: '#f9a8d4', tag: 'Original · Einaudi-inspired' },
{ id: 'cinematicStrings', name: 'Cinematic Strings', description: 'Warm, slowly swelling pads', icon: Music2Icon, premium: false, category: 'music', accent: '#c4b5fd', tag: 'Original · Zimmer-inspired' },
{ id: 'nocturne', name: 'Nocturne', description: 'Flowing night piano', icon: PianoIcon, premium: false, category: 'music', accent: '#fcd34d', tag: 'Original · Chopin-inspired' },

// Music — study beats & textures
{ id: 'lofi', name: 'Lo-fi Beats', description: 'Chill instrumental loops', icon: Music2Icon, premium: false, category: 'music', accent: '#f472b6', tag: 'No lyrics · ~70 BPM' },
{ id: 'beats', name: 'Study Beats', description: 'Steady pulse for deep work', icon: DrumIcon, premium: true, category: 'music', accent: '#fb7185', tag: 'No lyrics · ~75 BPM' },
{ id: 'guitar', name: 'Ambient Guitar', description: 'Slow arpeggios, soft ambience', icon: GuitarIcon, premium: true, category: 'music', accent: '#34d399', tag: 'No lyrics · slow arpeggios' },
{ id: 'focuswave', name: 'Focus Waves', description: 'Warm alpha pulse for calm focus', icon: ActivityIcon, premium: true, category: 'music', accent: '#818cf8', tag: '8 Hz alpha pulsing' },
{ id: 'piano', name: 'Soft Piano', description: 'Gentle keys, slow tempo', icon: PianoIcon, premium: true, category: 'music', accent: '#f59e0b', tag: 'No lyrics · slow tempo' }];
