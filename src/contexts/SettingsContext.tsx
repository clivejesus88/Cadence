import { createContext, useContext, useState, ReactNode } from 'react';
import { avatarImage } from '../constants/theme';

export interface UserProfile {
  name: string;
  email: string;
  school: string;
  avatarUrl: number;
  plan: 'free' | 'pro';
  memberSince: string;
}

export interface Preferences {
  defaultDuration: number;
  breakLength: number;
  autoStartBreaks: boolean;
  sessionReminders: boolean;
  dailySummary: boolean;
  blockDuringFocus: boolean;
  strictMode: boolean;
}

interface SettingsContextValue {
  profile: UserProfile;
  preferences: Preferences;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  hasSeenWelcome: boolean;
  dismissWelcome: () => void;
}

const defaultProfile: UserProfile = {
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  school: 'Second year · Biology',
  avatarUrl: avatarImage,
  plan: 'pro',
  memberSince: 'March 2026',
};

const defaultPreferences: Preferences = {
  defaultDuration: 25,
  breakLength: 5,
  autoStartBreaks: true,
  sessionReminders: true,
  dailySummary: false,
  blockDuringFocus: true,
  strictMode: false,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const dismissWelcome = () => setHasSeenWelcome(true);

  return (
    <SettingsContext.Provider
      value={{ profile: defaultProfile, preferences, updatePreference, hasSeenWelcome, dismissWelcome }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
