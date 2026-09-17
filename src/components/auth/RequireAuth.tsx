import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, isConfigured } = useAuth();

  if (!isConfigured) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-ink-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-ember-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
}