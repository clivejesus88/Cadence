import { CloudRainIcon, Music2Icon, TreePineIcon, WavesIcon, CoffeeIcon, MoonStarIcon } from 'lucide-react';
import { AmbientSound } from '../types/sound';

export const ambientSounds: AmbientSound[] = [
{ id: 'rain', name: 'Rainfall', description: 'Steady rain on a window', icon: CloudRainIcon, premium: false },
{ id: 'silence', name: 'Deep Silence', description: 'No sound, pure focus', icon: MoonStarIcon, premium: false },
{ id: 'lofi', name: 'Lo-fi Beats', description: 'Chill instrumental loops', icon: Music2Icon, premium: true },
{ id: 'forest', name: 'Forest Morning', description: 'Birdsong & light wind', icon: TreePineIcon, premium: true },
{ id: 'ocean', name: 'Ocean Waves', description: 'Slow rolling tide', icon: WavesIcon, premium: true },
{ id: 'cafe', name: 'Cafe Ambience', description: 'Soft chatter & espresso', icon: CoffeeIcon, premium: true }];