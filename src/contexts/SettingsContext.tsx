import { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { updatePreferences, updateProfile as updateProfileRepo } from '../db/repo';
import { scheduleSync } from '../db/sync';
import { useAuth } from './AuthContext';
import { UserProfile, Preferences, defaultProfile, defaultPreferences } from '../types/user';

export type { UserProfile, Preferences };

interface SettingsContextValue {
  profile: UserProfile;
  preferences: Preferences;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: {children: ReactNode;}) {
  const { user, isGuest } = useAuth();
  // Guest data lives under the local 'local' key so it syncs nowhere and is
  // migrated by adoptLocalData when the guest signs in for real.
  const uid = isGuest ? 'local' : user?.id ?? null;

  const profile = useLiveQuery(
    async () => {
      if (uid === null) return defaultProfile;
      const row = await db.profile.get(uid);
      const base = row && !row.deleted ? row.value : defaultProfile;
      return base;
    },
    [uid, isGuest],
    defaultProfile
  );

  const preferences = useLiveQuery(
    async () => {
      const row = await db.preferences.get(uid ?? 'local');
      return row && !row.deleted ? { ...defaultPreferences, ...row.value } : defaultPreferences;
    },
    [uid],
    defaultPreferences
  );

  const handleUpdatePreference = <K extends keyof Preferences,>(key: K, value: Preferences[K]) => {
    void updatePreferences({ [key]: value }).then(() => scheduleSync());
  };

  const handleUpdateProfile = (patch: Partial<UserProfile>) => {
    void updateProfileRepo(patch).then(() => scheduleSync());
  };

  return (
    <SettingsContext.Provider
      value={{
        profile,
        preferences,
        updatePreference: handleUpdatePreference,
        updateProfile: handleUpdateProfile
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}