import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { adoptLocalData, setSyncUserId, updateProfile } from '../db/repo';
import { runSync, initSync } from '../db/sync';
import { seedIfEmpty } from '../db/seed';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAppUser(user: User): AppUser {
  const metaName = (user.user_metadata?.name as string | undefined)?.trim() ?? '';
  return {
    id: user.id,
    email: user.email ?? '',
    name: metaName.length > 0 ? metaName : 'Guest'
  };
}

async function applyUserSession(user: User): Promise<void> {
  await seedIfEmpty();
  setSyncUserId(user.id);
  await adoptLocalData(user.id);

  const metaName = (user.user_metadata?.name as string | undefined)?.trim() ?? '';
  await updateProfile({ name: metaName.length > 0 ? metaName : 'Guest', email: user.email ?? '' });

  await runSync();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
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
      setUser(u ? toAppUser(u) : null);
      if (u) {
        void applyUserSession(u);
      } else {
        setSyncUserId(null);
      }
    });

    (async () => {
      await seedIfEmpty();
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u ? toAppUser(u) : null);
      if (u) await applyUserSession(u);
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

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase isn’t configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable accounts.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ needsConfirmation: boolean }> => {
    if (!supabase) throw new Error('Supabase isn’t configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable accounts.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    if (data.user && data.session) {
      await applyUserSession(data.user);
    }
    return { needsConfirmation: !data.session };
  };

  const signOut = async (): Promise<void> => {
    if (supabase) await supabase.auth.signOut();
    setSyncUserId(null);
  };

  const value: AuthContextValue = {
    user,
    loading,
    isConfigured: isSupabaseConfigured,
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