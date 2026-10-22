import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeftIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  Loader2Icon,
  ShieldCheckIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeText, sanitizeEmail, isValidEmail } from '../../utils/sanitize';

interface AuthScreenProps {
  onSuccess: () => void;
  onBack: () => void;
  onGuest?: () => void;
}

const HERO_IMAGE_URL = "/2db10ed4-907b-405f-a887-1dfb58489242.jpg";

export function AuthScreen({ onSuccess, onBack, onGuest }: AuthScreenProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanEmail = sanitizeEmail(email);
    const cleanName = sanitizeText(name, 60);
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(cleanEmail, password, cleanName);
        if (needsConfirmation) {
          setNotice(`We sent a confirmation link to ${cleanEmail}. Confirm it, then sign in.`);
          setMode('signin');
          setPassword('');
          return;
        }
      } else {
        await signIn(cleanEmail, password);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setNotice(null);
  };

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img src={HERO_IMAGE_URL} alt="" className="h-full w-full scale-110 object-cover blur-2xl" />
        <div className="absolute inset-0 bg-ink-950/50" />
        <div className="absolute -top-10 -right-16 h-72 w-72 rounded-full bg-ember-500/25 blur-[100px]" />
        <div className="absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-sky-500/15 blur-[100px]" />
      </div>

      <button
        onClick={onBack}
        aria-label="Back"
        className="hit-slop glass-inset absolute left-5 top-[max(1.5rem,env(safe-area-inset-top))] z-20 flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity hover:opacity-70 active:scale-95">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <p className="font-display text-2xl text-white">Cadence</p>
          <h1 className="mt-1 font-display text-3xl text-white sm:text-4xl">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            {mode === 'signin' ? 'Sign in to access your focus space.' : 'Sign up to sync your focus data across devices.'}
          </p>

          <div className="glass-strong mt-6 rounded-3xl p-5">
            <div className="glass-inset flex rounded-full p-1">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={toggleMode}
                  aria-pressed={mode === m}
                  className={`flex-1 rounded-full py-3 text-sm font-semibold transition-all active:scale-95 ${
                    mode === m ? 'bg-white text-ink-950' : 'text-neutral-300'
                  }`}>
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5 pt-5">
              {mode === 'signup' && (
                <motion.label
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="block">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-400">Name</span>
                  <div className="group glass-inset flex items-center gap-2.5 rounded-2xl px-3.5 py-3 transition-colors focus-within:bg-white/5">
                    <UserIcon className="h-4 w-4 text-neutral-500 transition-colors group-focus-within:text-ember-400" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={60}
                      autoComplete="name"
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                    />
                  </div>
                </motion.label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-neutral-400">Email</span>
                <div className="glass-inset flex items-center gap-2.5 rounded-2xl px-3.5 py-3">
                  <MailIcon className="h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@school.edu"
                    className="w-full bg-transparent text-base text-white placeholder:text-neutral-600 focus:outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-neutral-400">Password</span>
                <div className="glass-inset flex items-center gap-2.5 rounded-2xl px-3.5 py-3">
                  <LockIcon className="h-4 w-4 text-neutral-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                  />
                </div>
              </label>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs leading-5 text-red-400">
                  {error}
                </motion.p>
              )}
              {notice && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs leading-5 text-emerald-400">
                  {notice}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.995] disabled:opacity-60">
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Please wait
                  </span>
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                <span>Your data stays private & encrypted</span>
              </div>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-neutral-500">
            {mode === 'signin' ? 'New to Cadence?' : 'Already have an account?'}{' '}
            <button onClick={toggleMode} className="hit-slop px-2 py-2 font-semibold text-ember-400 transition-colors hover:text-ember-300 active:text-white">
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {onGuest && (
            <button
              type="button"
              onClick={onGuest}
              className="hit-slop mx-auto mt-2 block px-3 py-2 text-sm text-neutral-500 transition-colors hover:text-neutral-300 active:text-white">
              Continue as guest
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}