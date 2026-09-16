export interface UserProfile {
  id: string;
  name: string;
  email: string;
  school: string;
  avatarUrl: string;
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

export const defaultProfile: UserProfile = {
  id: 'local',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  school: 'Second year · Biology',
  avatarUrl: "/41934678-ca28-4660-a31a-3e5350bae9d7.jpg",
  plan: 'pro',
  memberSince: 'March 2026'
};

export const defaultPreferences: Preferences = {
  defaultDuration: 25,
  breakLength: 5,
  autoStartBreaks: true,
  sessionReminders: true,
  dailySummary: false,
  blockDuringFocus: true,
  strictMode: false
};