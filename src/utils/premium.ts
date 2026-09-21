import { UserProfile } from '../types/user';

export const FREE_SOUND_IDS = ['rain', 'silence'];

export type FeatureKey = 'customDuration' | 'premiumSounds' | 'blockingRules' | 'deepInsights';

export function isPro(profile: UserProfile | null | undefined): boolean {
  return profile?.plan === 'pro';
}

export const FEATURE_COPY: Record<FeatureKey, { title: string; desc: string }> = {
  customDuration: { title: 'Unlimited custom sessions', desc: 'Spin the dial to any duration — up to 24 hours.' },
  premiumSounds: { title: 'Premium soundscapes', desc: 'Unlock every focus sound in the library.' },
  blockingRules: { title: 'Advanced blocking rules', desc: 'Block by schedule, per app, or per website.' },
  deepInsights: { title: 'Deeper insights', desc: 'See patterns across months, not just weeks.' }
};