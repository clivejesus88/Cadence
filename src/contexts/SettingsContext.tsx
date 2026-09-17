import { createContext, useContext, useState, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { updatePreferences, dismissWelcome, hasSeenWelcome } from '../db/repo';
import { scheduleSync } from '../db/sync';
import { useAuth } from './AuthContext';
import { UserProfile, Preferences, defaultProfile, defaultPreferences } from '../types/user';

export type { UserProfile, Preferences };

interface SettingsContextValue {
  profile: UserProfile;
  preferences: Preferences;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  hasSeenWelcome: boolean;
  dismissWelcome: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: {children: ReactNode;}) {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const profile = useLiveQuery(
    async () => {
      if (uid === null) return defaultProfile;
      const row = await db.profile.get(uid);
      return row && !row.deleted ? row.value : defaultProfile;
    },
    [uid],
    defaultProfile
  );

  const preferences = useLiveQuery(
    async () => {
      const row = await db.preferences.get(uid ?? 'local');
      return row && !row.deleted ? row.value : defaultPreferences;
    },
    [uid],
    defaultPreferences
  );

  const [seenWelcome, setSeenWelcome] = useState(() => hasSeenWelcome());

  const handleUpdatePreference = <K extends keyof Preferences,>(key: K, value: Preferences[K]) => {
    void updatePreferences({ [key]: value }).then(() => scheduleSync());
  };

  const handleDismissWelcome = () => {
    setSeenWelcome(true);
    void dismissWelcome();
  };

  return (
    <SettingsContext.Provider
      value={{
        profile,
        preferences,
        updatePreference: handleUpdatePreference,
        hasSeenWelcome: seenWelcome,
        dismissWelcome: handleDismissWelcome
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