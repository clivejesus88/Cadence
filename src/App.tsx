import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppDataProvider } from './contexts/AppDataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Focus } from './pages/Focus';
import { Insights } from './pages/Insights';
import { Planner } from './pages/Planner';
import { Profile } from './pages/Profile';

export function App() {
  return (
    <AppDataProvider>
      <SettingsProvider>
        <div className="w-full min-h-screen bg-ink-950">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<OnboardingFlow />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="focus" element={<Focus />} />
                <Route path="insights" element={<Insights />} />
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
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }} />
          
        </div>
      </SettingsProvider>
    </AppDataProvider>);

}