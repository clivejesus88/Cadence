import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { AppLayout } from './components/layout/AppLayout';

const SentryRoutes = Sentry.wrapReactRouterRouting(Routes);
const OnboardingFlow = lazy(() => import('./pages/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow })));
const AuthScreen = lazy(() => import('./components/auth/AuthScreen').then((m) => ({ default: m.AuthScreen })));
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Focus = lazy(() => import('./pages/Focus').then((m) => ({ default: m.Focus })));
const Planner = lazy(() => import('./pages/Planner').then((m) => ({ default: m.Planner })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Insights = lazy(() => import('./pages/Insights').then((m) => ({ default: m.Insights })));
const BlockingRules = lazy(() => import('./pages/BlockingRules').then((m) => ({ default: m.BlockingRules })));
const PrivacyPolicy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/Legal').then((m) => ({ default: m.TermsOfService })));

function PageLoader() {
  return (
    <div className="flex w-full items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-ember-400" />
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="flex w-full min-h-[100dvh] items-center justify-center bg-ink-950">
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

function ErrorFallback() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const wasOffline = useRef(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      setIsOffline(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline.current) {
        wasOffline.current = false;
        window.location.reload();
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
      <p className="font-display text-xl text-white">Something went wrong</p>
      <p className="max-w-xs text-sm text-neutral-400">
        {isOffline
          ? 'You’re offline. Cadence will reload automatically when your connection returns.'
          : 'An unexpected error occurred. Your data is safe — try loading Cadence again.'}
      </p>
      {!isOffline && (
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-950 active:scale-[0.98]">
          Try again
        </button>
      )}
    </div>
  );
}

export function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <SettingsProvider>
            <AppDataProvider>
              <div className="h-[100dvh] w-full overflow-hidden bg-ink-950">
                <BrowserRouter>
              <SentryRoutes>
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<FullPageLoader />}>
                      <OnboardingFlow />
                    </Suspense>
                  }
                />
                <Route
                  path="/sign-in"
                  element={
                    <Suspense fallback={<FullPageLoader />}>
                      <SignInRoute />
                    </Suspense>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <PrivacyPolicy />
                    </Suspense>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <TermsOfService />
                    </Suspense>
                  }
                />
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }>
                  <Route index element={<Navigate to="home" replace />} />
                  <Route
                    path="home"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Home />
                      </Suspense>
                    }
                  />
                  <Route
                    path="focus"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Focus />
                      </Suspense>
                    }
                  />
                  <Route
                    path="insights"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Insights />
                      </Suspense>
                    }
                  />
                  <Route
                    path="planner"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Planner />
                      </Suspense>
                    }
                  />
                  <Route
                    path="blocking"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BlockingRules />
                      </Suspense>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Profile />
                      </Suspense>
                    }
                  />
                </Route>
                <Route path="*" element={<NotFoundRedirect />} />
              </SentryRoutes>
            </BrowserRouter>
            <Toaster
              position="top-center"
              gap={12}
              offset={{ top: 'max(1rem, env(safe-area-inset-top))' }}
              mobileOffset={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
              toastOptions={{ unstyled: true, className: 'w-full flex justify-center px-4' }}
              icons={{ close: null }}
            />
              </div>
            </AppDataProvider>
          </SettingsProvider>
        </AuthProvider>
      </MotionConfig>
    </Sentry.ErrorBoundary>
  );
}