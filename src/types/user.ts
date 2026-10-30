import { BlockingRule } from './blocklist';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  school: string;
  avatarUrl: string;
  plan: 'free' | 'pro';
  memberSince: string;
  timezone: string;
}

export interface Preferences {
  defaultDuration: number;
  breakLength: number;
  autoStartBreaks: boolean;
  sessionReminders: boolean;
  taskReminders: boolean;
  dailySummary: boolean;
  blockDuringFocus: boolean;
  strictMode: boolean;
  dailyGoalMinutes: number;
  blockingRules: BlockingRule[];
}

export const defaultProfile: UserProfile = {
  id: 'local',
  name: '',
  email: '',
  school: '',
  avatarUrl: 'preset:adventurer-ember',
  plan: 'free',
  memberSince: '',
  timezone: ''
};

export const defaultPreferences: Preferences = {
  defaultDuration: 25,
  breakLength: 5,
  autoStartBreaks: true,
  sessionReminders: true,
  taskReminders: true,
  dailySummary: false,
  blockDuringFocus: true,
  strictMode: false,
  dailyGoalMinutes: 60,
  blockingRules: []
};