import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, MailIcon, LockIcon, UserIcon, Loader2Icon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

const HERO_IMAGE_URL = "/2db10ed4-907b-405f-a887-1dfb58489242.jpg";

export function AuthScreen({ onSuccess, onBack }: AuthScreenProps) {
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
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email.trim(), password, name.trim());
        if (needsConfirmation) {
          setNotice(`We sent a confirmation link to ${email.trim()}. Confirm it, then sign in.`);
          setMode('signin');
          setPassword('');
          return;
        }
      } else {
        await signIn(email.trim(), password);
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
    <div className="relative w-full min-h-screen overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img src={HERO_IMAGE_URL} alt="" className="h-full w-full scale-110 object-cover blur-2xl" />
        <div className="absolute inset-0 bg-ink-950/45" />
        <div className="absolute -top-10 -right-16 h-72 w-72 rounded-full bg-ember-500/25 blur-[100px]" />
        <div className="absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-sky-500/15 blur-[100px]" />
      </div>

      <button
        onClick={onBack}
        aria-label="Back"
        className="glass-inset absolute left-5 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity hover:opacity-70">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <p className="font-display text-2xl text-white">Cadence</p>
          <h1 className="mt-1 font-display text-3xl text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            {mode === 'signin' ? 'Sign in to keep your focus streak alive.' : 'Takes under a minute — your data stays in sync.'}
          </p>

          <div className="glass-strong mt-6 rounded-3xl p-5">
            <div className="glass-inset flex rounded-full p-1">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={toggleMode}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                    mode === m ? 'bg-white text-ink-950' : 'text-neutral-300'
                  }`}>
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-400">Name</span>
                  <div className="glass-inset flex items-center gap-2.5 rounded-2xl px-3.5 py-3">
                    <UserIcon className="h-4 w-4 text-neutral-500" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                    />
                  </div>
                </label>
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
                    autoComplete="email"
                    placeholder="you@school.edu"
                    className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
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
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs leading-5 text-red-400">{error}</p>
              )}
              {notice && (
                <p className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs leading-5 text-emerald-400">{notice}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60">
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Please wait…
                  </span>
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-neutral-500">
            {mode === 'signin' ? 'New to Cadence?' : 'Already have an account?'}{' '}
            <button onClick={toggleMode} className="font-semibold text-ember-400">
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}