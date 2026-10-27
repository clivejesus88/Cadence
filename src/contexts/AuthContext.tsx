import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { adoptLocalData, setSyncUserId, updateProfile } from '../db/repo';
import { runSync, initSync } from '../db/sync';
import { seedIfEmpty } from '../db/seed';
import { detectTimezone } from '../utils/timezone';
import { syncPushSubscription } from '../utils/push';
import { consume, reset, formatRetry, AUTH_LIMIT } from '../utils/rateLimit';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const GUEST_FLAG_KEY = 'cadence:guest';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function guestUser(): AppUser {
  return { id: 'guest', email: '', name: '' };
}

function hasGuestFlag(): boolean {
  try {
    return localStorage.getItem(GUEST_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function setGuestFlag(on: boolean): void {
  try {
    if (on) localStorage.setItem(GUEST_FLAG_KEY, '1');
    else localStorage.removeItem(GUEST_FLAG_KEY);
  } catch {
    // storage unavailable — guest simply won't persist across reloads
  }
}

function toAppUser(user: User): AppUser {
  const metaName = (user.user_metadata?.name as string | undefined)?.trim() ?? '';
  return {
    id: user.id,
    email: user.email ?? '',
    name: metaName
  };
}

async function applyUserSession(user: User): Promise<void> {
  await seedIfEmpty();
  setSyncUserId(user.id);
  await adoptLocalData(user.id);

  const metaName = (user.user_metadata?.name as string | undefined)?.trim() ?? '';
  await updateProfile({ name: metaName, email: user.email ?? '', timezone: detectTimezone() });

  void syncPushSubscription(user.id).catch((error) => {
    console.error('[auth] failed to sync push subscription:', error);
  });
  await runSync();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => (hasGuestFlag() ? guestUser() : null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setSyncUserId(null);
      void seedIfEmpty().finally(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    const subscribe = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      if (u) {
        setGuestFlag(false);
        setUser(toAppUser(u));
        void applyUserSession(u);
      } else {
        setSyncUserId(null);
        setUser(hasGuestFlag() ? guestUser() : null);
      }
    });

    (async () => {
      await seedIfEmpty();
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const u = data.session?.user ?? null;
      if (u) {
        setUser(toAppUser(u));
        await applyUserSession(u);
      } else {
        setUser(hasGuestFlag() ? guestUser() : null);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
      subscribe.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    return initSync();
  }, []);

  const continueAsGuest = () => {
    setGuestFlag(true);
    setSyncUserId(null);
    setUser(guestUser());
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase isn’t configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable accounts.');
    const limit = consume('auth', AUTH_LIMIT);
    if (!limit.allowed) {
      throw new Error(`Too many attempts. Please wait ${formatRetry(limit.retryAfterMs)} and try again.`);
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    reset('auth');
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ needsConfirmation: boolean }> => {
    if (!supabase) throw new Error('Supabase isn’t configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable accounts.');
    const limit = consume('auth', AUTH_LIMIT);
    if (!limit.allowed) {
      throw new Error(`Too many attempts. Please wait ${formatRetry(limit.retryAfterMs)} and try again.`);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    if (data.user && data.session) {
      await applyUserSession(data.user);
    }
    reset('auth');
    return { needsConfirmation: !data.session };
  };

  const signOut = async (): Promise<void> => {
    setGuestFlag(false);
    if (supabase) await supabase.auth.signOut();
    setSyncUserId(null);
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    loading,
    isConfigured: isSupabaseConfigured,
    isGuest: user?.id === 'guest',
    continueAsGuest,
    signIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}