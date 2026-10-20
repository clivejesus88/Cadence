import { lazy, Suspense } from 'react';
import * as Sentry from '@sentry/react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Focus } from './pages/Focus';
import { Planner } from './pages/Planner';
import { Profile } from './pages/Profile';

const SentryRoutes = Sentry.wrapReactRouterRouting(Routes);
const Insights = lazy(() => import('./pages/Insights').then((m) => ({ default: m.Insights })));
const BlockingRules = lazy(() => import('./pages/BlockingRules').then((m) => ({ default: m.BlockingRules })));

function PageLoader() {
  return (
    <div className="flex w-full items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-ember-400" />
    </div>
  );
}

function NotFoundRedirect() {
  const location = useLocation();
  return <Navigate to={location.pathname.startsWith('/app') ? '/app/home' : '/'} replace />;
}

function SignInRoute() {
  const navigate = useNavigate();
  return (
    <AuthScreen
      onSuccess={() => navigate('/app/home', { replace: true })}
      onBack={() => navigate('/app/home', { replace: true })}
    />
  );
}

export function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
          <p className="font-display text-xl text-white">Something went wrong</p>
          <p className="max-w-xs text-sm text-neutral-400">
            An unexpected error occurred. Your data is safe — reload to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-950 active:scale-[0.98]">
            Reload app
          </button>
        </div>
      }>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <AppDataProvider>
            <SettingsProvider>
              <div className="w-full min-h-[100dvh] bg-ink-950">
                <BrowserRouter>
              <SentryRoutes>
                <Route path="/" element={<OnboardingFlow />} />
                <Route path="/sign-in" element={<SignInRoute />} />
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }>
                  <Route index element={<Navigate to="home" replace />} />
                  <Route path="home" element={<Home />} />
                  <Route path="focus" element={<Focus />} />
                  <Route
                    path="insights"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Insights />
                      </Suspense>
                    }
                  />
                  <Route path="planner" element={<Planner />} />
                  <Route
                    path="blocking"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BlockingRules />
                      </Suspense>
                    }
                  />
                  <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<NotFoundRedirect />} />
              </SentryRoutes>
            </BrowserRouter>
            <Toaster
              position="top-center"
              gap={10}
              toastOptions={{ unstyled: true, className: 'w-full flex justify-center px-4' }}
              style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            />
              </div>
            </SettingsProvider>
          </AppDataProvider>
        </AuthProvider>
      </MotionConfig>
    </Sentry.ErrorBoundary>
  );
}