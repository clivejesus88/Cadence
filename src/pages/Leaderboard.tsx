import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LoaderCircleIcon, TrophyIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RankCrown } from '../components/leaderboard/RankCrown';
import {
  getLeaderboardProfile,
  getWeeklyLeaderboard,
  LeaderboardEntry,
  saveLeaderboardProfile,
  validateLeaderboardAlias
} from '../utils/leaderboard';

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('duplicate key')) {
      return 'That alias is already in use. Try another one.';
    }
    return error.message;
  }
  return 'Please try again.';
}

export function Leaderboard() {
  const navigate = useNavigate();
  const { user, isGuest, isConfigured } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [alias, setAlias] = useState('');
  const [optedIn, setOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user || isGuest || !isConfigured) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    Promise.all([getLeaderboardProfile(), getWeeklyLeaderboard()])
      .then(([profile, board]) => {
        if (!active) return;
        setAlias(profile?.alias ?? '');
        setOptedIn(profile?.optedIn ?? false);
        setEntries(board);
      })
      .catch((loadError: unknown) => {
        if (active) setError(describeError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, isGuest, isConfigured]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const safeAlias = validateLeaderboardAlias(alias);
      await saveLeaderboardProfile(user.id, safeAlias, true);
      setAlias(safeAlias);
      setOptedIn(true);
      setSaved(true);
      setEntries(await getWeeklyLeaderboard());
    } catch (saveError) {
      setError(describeError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !alias) return;

    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await saveLeaderboardProfile(user.id, alias, false);
      setOptedIn(false);
      setEntries(await getWeeklyLeaderboard());
    } catch (saveError) {
      setError(describeError(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 pt-8 pb-8 lg:px-8 lg:pt-10">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/home')}
          aria-label="Back to dashboard"
          className="hit-slop glass-inset flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white active:scale-95">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl text-white">Weekly leaderboard</h1>
          <p className="mt-1 text-sm text-neutral-400">A fresh start every Monday.</p>
        </div>
      </header>

      <section className="glass-strong mt-6 rounded-3xl p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-ember-500/15 text-ember-400">
            <TrophyIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Focus steadily, at your pace</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              Rankings use completed focus minutes from Monday 00:00 UTC. At most 120 minutes per day count;
              all your focus time still counts in your personal stats. No streak penalties.
            </p>
          </div>
        </div>
      </section>

      {isGuest ? (
        <section className="glass mt-5 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-white">Sign in to see the global board</p>
          <p className="mt-1 text-xs text-neutral-400">Your focus sessions stay on this device until you choose to sync an account.</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="mt-4 rounded-full bg-ember-500 px-5 py-2.5 text-sm font-semibold text-ink-950 active:scale-[0.98]">
            Sign in
          </button>
        </section>
      ) : !isConfigured ? (
        <section className="glass mt-5 rounded-2xl p-5 text-center text-sm text-neutral-400">
          The global leaderboard is unavailable because cloud accounts are not configured.
        </section>
      ) : !online ? (
        <section className="glass mt-5 rounded-2xl p-5 text-center text-sm text-neutral-400">
          Connect to the internet to load the live leaderboard. Your personal focus tracking still works offline.
        </section>
      ) : (
        <>
          <section className="glass mt-5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white">
              {optedIn ? 'You’re on the board' : 'Join the global board'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              Only your chosen alias and weekly total are shown. Your name, email, and individual sessions are never displayed.
              You can leave whenever you like.
            </p>
            <form onSubmit={handleSave} className="mt-4">
              <label htmlFor="leaderboard-alias" className="mb-1.5 block text-xs font-medium text-neutral-300">
                Leaderboard alias
              </label>
              <input
                id="leaderboard-alias"
                value={alias}
                onChange={(event) => {
                  setAlias(event.target.value);
                  setSaved(false);
                }}
                maxLength={24}
                autoComplete="nickname"
                placeholder="e.g. FocusFox"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-ember-400 placeholder:text-neutral-600"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-ember-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition active:scale-[0.98] disabled:opacity-50">
                  {saving ? 'Saving…' : optedIn ? 'Update alias' : 'Opt in'}
                </button>
                {optedIn && (
                  <button
                    type="button"
                    onClick={() => void handleLeave()}
                    disabled={saving}
                    className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/[0.06] disabled:opacity-50">
                    Leave leaderboard
                  </button>
                )}
                {saved && <span role="status" className="text-xs text-emerald-300">You’re opted in.</span>}
              </div>
            </form>
          </section>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">This week</h2>
              <span className="text-xs text-neutral-500">Minutes · UTC</span>
            </div>
            <div className="glass overflow-hidden rounded-2xl">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-neutral-400">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  Loading leaderboard…
                </div>
              ) : error && entries.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-neutral-400">Couldn’t load the leaderboard. Check your connection and try again.</div>
              ) : entries.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-neutral-400">
                  No one has joined this week yet. Opt in to be among the first.
                </div>
              ) : (
                <ol className="divide-y divide-white/[0.06]">
                  {entries.map((entry) => (
                    <li
                      key={`${entry.rank}-${entry.alias}`}
                      className={`flex items-center gap-3 px-4 py-3 ${entry.isCurrentUser ? 'bg-ember-500/[0.08]' : ''}`}>
                      <span className={`w-8 text-center text-sm font-bold tabular-nums ${entry.rank === 1 ? 'text-amber-200' : entry.rank <= 3 ? 'text-ember-300' : 'text-neutral-500'}`}>
                        {entry.rank <= 3 ? <RankCrown rank={entry.rank} className="mx-auto h-4 w-4" /> : entry.rank}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-sm ${entry.isCurrentUser ? 'font-semibold text-white' : 'text-neutral-300'}`}>
                        {entry.alias}{entry.isCurrentUser ? ' (you)' : ''}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-neutral-300">{entry.focusMinutes} min</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
