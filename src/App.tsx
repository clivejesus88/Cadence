import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Focus } from './pages/Focus';
import { Planner } from './pages/Planner';
import { Profile } from './pages/Profile';

const Insights = lazy(() => import('./pages/Insights').then((m) => ({ default: m.Insights })));

function PageLoader() {
  return (
    <div className="flex w-full items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-ember-400" />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <SettingsProvider>
          <div className="w-full min-h-screen bg-ink-950">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<OnboardingFlow />} />
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
                  <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
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
  );
}