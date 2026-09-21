import { UserProfile } from '../types/user';

export type FeatureKey = 'premiumSounds' | 'blockingRules';

export function isPro(profile: UserProfile | null | undefined): boolean {
  return profile?.plan === 'pro';
}

export const FEATURE_COPY: Record<FeatureKey, { title: string; desc: string }> = {
  premiumSounds: { title: 'Premium soundscapes', desc: 'Unlock every focus sound in the library.' },
  blockingRules: { title: 'Advanced blocking rules', desc: 'Block by schedule, per app, or per website.' }
};