import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasChosenAvatar } from '../../utils/onboarding';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex w-full min-h-[100dvh] items-center justify-center bg-ink-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-ember-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!hasChosenAvatar(user.id)) return <Navigate to="/" replace />;

  return <>{children}</>;
}