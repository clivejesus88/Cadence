import { supabase } from '../lib/supabase';
import { sanitizeAvatarUrl } from './sanitize';

export interface LeaderboardProfile {
  alias: string;
  optedIn: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  alias: string;
  focusMinutes: number;
  isCurrentUser: boolean;
  avatarUrl: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('The leaderboard requires a configured account connection.');
  }
  return supabase;
}

export function validateLeaderboardAlias(alias: string): string {
  const trimmed = alias.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{1,23}$/.test(trimmed)) {
    throw new Error('Use 2–24 letters, numbers, spaces, periods, underscores, or hyphens. Start with a letter or number.');
  }
  return trimmed;
}

export async function getLeaderboardProfile(): Promise<LeaderboardProfile | null> {
  const { data, error } = await requireSupabase()
    .from('leaderboard_profiles')
    .select('alias, opted_in')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  if (typeof data.alias !== 'string' || typeof data.opted_in !== 'boolean') {
    throw new Error('The leaderboard profile response was invalid.');
  }
  return { alias: data.alias, optedIn: data.opted_in };
}

export async function saveLeaderboardProfile(
  userId: string,
  alias: string,
  optedIn: boolean
): Promise<void> {
  const safeAlias = validateLeaderboardAlias(alias);
  const { error } = await requireSupabase()
    .from('leaderboard_profiles')
    .upsert({ user_id: userId, alias: safeAlias, opted_in: optedIn }, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await requireSupabase().rpc('get_weekly_leaderboard');
  if (error) throw error;
  if (!Array.isArray(data)) {
    throw new Error('The leaderboard response was invalid.');
  }

  return data.map((row: unknown) => {
    if (
      typeof row !== 'object' ||
      row === null ||
      !('rank_position' in row) ||
      !('display_alias' in row) ||
      !('focus_minutes' in row) ||
      !('is_current_user' in row) ||
      typeof row.rank_position !== 'number' ||
      typeof row.display_alias !== 'string' ||
      typeof row.focus_minutes !== 'number' ||
      typeof row.is_current_user !== 'boolean' ||
      !Number.isInteger(row.rank_position) ||
      !Number.isInteger(row.focus_minutes)
    ) {
      throw new Error('The leaderboard response contained an invalid entry.');
    }

    const avatarUrl = typeof row.avatar_url === 'string' ? sanitizeAvatarUrl(row.avatar_url) : '';

    return {
      rank: row.rank_position,
      alias: row.display_alias,
      focusMinutes: row.focus_minutes,
      isCurrentUser: row.is_current_user,
      avatarUrl: avatarUrl || 'preset:adventurer-ember'
    };
  });
}
