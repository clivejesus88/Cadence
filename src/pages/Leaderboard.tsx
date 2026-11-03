import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CheckIcon, ChevronUpIcon, CrownIcon, LoaderCircleIcon, LockIcon, TrophyIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RankCrown } from '../components/leaderboard/RankCrown';
import { formatFocusTime } from '../utils/time';
import { Avatar } from '../components/profile/Avatar';
import { celebrate } from '../utils/celebration';
import {
  getLeaderboardProfile,
  getWeeklyLeaderboard,
  LeaderboardEntry,
  saveLeaderboardProfile,
  validateLeaderboardAlias
} from '../utils/leaderboard';

const LEAGUE_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const LEAGUE_STYLES = [
  { color: 'text-orange-200', marker: 'bg-orange-300/75', tile: 'border-orange-300/35 bg-orange-300/[0.08]', icon: 'bg-orange-300/10' },
  { color: 'text-slate-200', marker: 'bg-slate-200/75', tile: 'border-slate-300/35 bg-slate-200/[0.08]', icon: 'bg-slate-200/10' },
  { color: 'text-amber-200', marker: 'bg-amber-300/75', tile: 'border-amber-300/35 bg-amber-300/[0.08]', icon: 'bg-amber-300/10' },
  { color: 'text-cyan-200', marker: 'bg-cyan-300/75', tile: 'border-cyan-300/35 bg-cyan-300/[0.08]', icon: 'bg-cyan-300/10' },
  { color: 'text-violet-200', marker: 'bg-violet-300/75', tile: 'border-violet-300/35 bg-violet-300/[0.08]', icon: 'bg-violet-300/10' }
];

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
  const refreshing = useRef(false);
  const celebratedPromotionWeeks = useRef(new Set<string>());

  const refreshLeaderboard = useCallback(async (showLoading = false) => {
    if (!user || isGuest || !isConfigured) {
      setLoading(false);
      return;
    }
    if (refreshing.current) return;

    refreshing.current = true;
    if (showLoading) {
      setLoading(true);
      setError('');
    }
    try {
      const [profile, board] = await Promise.all([getLeaderboardProfile(), getWeeklyLeaderboard()]);
      setAlias(profile?.alias ?? '');
      setOptedIn(profile?.optedIn ?? false);
      setEntries(board);
      const promotedEntry = board.find((entry) => entry.isCurrentUser && entry.promoted);
      if (promotedEntry && !celebratedPromotionWeeks.current.has(promotedEntry.weekStart)) {
        celebratedPromotionWeeks.current.add(promotedEntry.weekStart);
        celebrate();
      }
    } catch (loadError: unknown) {
      setError(describeError(loadError));
    } finally {
      refreshing.current = false;
      if (showLoading) setLoading(false);
    }
  }, [user, isGuest, isConfigured]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      void refreshLeaderboard();
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshLeaderboard]);

  useEffect(() => {
    if (!user || isGuest || !isConfigured) {
      setLoading(false);
      return;
    }

    void refreshLeaderboard(true);
    const refresh = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void refreshLeaderboard();
      }
    };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('cadence:sync-complete', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('cadence:sync-complete', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [user, isGuest, isConfigured, refreshLeaderboard]);

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

  const currentUserEntry = entries.find((entry) => entry.isCurrentUser);
  const promotionCutoff = currentUserEntry
    ? currentUserEntry.leagueSize < 3
      ? currentUserEntry.leagueSize
      : Math.max(1, Math.ceil(currentUserEntry.leagueSize * 0.2))
    : 0;
  const relegationCutoff = promotionCutoff;
  const leagueStyle = currentUserEntry
    ? LEAGUE_STYLES[currentUserEntry.leagueTier - 1]
    : LEAGUE_STYLES[0];
  const leagueMessage = currentUserEntry?.promoted
    ? `Promoted to ${LEAGUE_NAMES[currentUserEntry.leagueTier - 1]} this week. Keep it up!`
    : !currentUserEntry
      ? 'Join a league to compete for weekly promotion.'
      : currentUserEntry.leagueSize < 3 && currentUserEntry.leagueTier < LEAGUE_NAMES.length
        ? 'Small league this week — everyone advances on Monday.'
        : currentUserEntry.leagueTier === LEAGUE_NAMES.length
          ? 'You’ve reached the top league. Keep your Diamond spot shining.'
          : currentUserEntry.leagueSize < 5
      ? `${5 - currentUserEntry.leagueSize} more ${5 - currentUserEntry.leagueSize === 1 ? 'member' : 'members'} needed to unlock weekly promotions.`
        : currentUserEntry.leagueRank <= promotionCutoff
        ? `You’re in a promotion spot — the top ${promotionCutoff} advance on Monday.`
        : currentUserEntry.leagueTier > 1 &&
            currentUserEntry.leagueRank > currentUserEntry.leagueSize - relegationCutoff
          ? `Focus this week to stay in ${LEAGUE_NAMES[currentUserEntry.leagueTier - 1]}.`
          : `Top ${promotionCutoff} advance and bottom ${relegationCutoff} move down on Monday.`;
  const leagueProgress = currentUserEntry
    ? Math.max(
        0,
        Math.min(
          100,
          ((currentUserEntry.leagueSize - currentUserEntry.leagueRank + 1) /
            Math.max(1, currentUserEntry.leagueSize)) *
            100
        )
      )
    : 0;

  return (
    <div className="px-5 pt-6 pb-8 lg:px-8 lg:pt-8">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/home')}
          aria-label="Back to dashboard"
          className="hit-slop flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white active:scale-95">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="page-title text-white">
            Weekly leagues
          </h1>
        </div>
      </header>

      <section className="group relative mt-6 w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(22,27,31,0.92),rgba(13,15,18,0.96))] p-5 shadow-[0_18px_42px_-28px_rgba(0,0,0,0.95)] transition-all hover:border-white/[0.12]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-neutral-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <TrophyIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">The weekly climb</p>
            <p className="mt-1 text-sm font-medium text-white">Focus minutes move you up.</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-400">
          Rise with the top 20% each Monday; when a league has fewer than three members, everyone advances. Five
          leagues bring a fresh challenge every week, while all your focus time still counts toward your personal stats.
        </p>
        <div className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Five weekly league tiers">
          {LEAGUE_NAMES.map((name, index) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <span className={`h-1 w-full rounded-full ${LEAGUE_STYLES[index].marker}`} />
              <span className="text-[9px] font-medium tracking-wide text-neutral-500">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {isGuest ? (
        <section className="mt-5 rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(22,27,31,0.92),rgba(13,15,18,0.96))] p-5 text-center shadow-[0_18px_42px_-28px_rgba(0,0,0,0.95)]">
          <p className="text-sm font-semibold text-white">Sign in to see the global board</p>
          <p className="mt-1 text-xs text-neutral-400">Your focus sessions stay on this device until you choose to sync an account.</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="mt-4 rounded-full bg-ember-500 px-5 py-2.5 text-sm font-semibold text-ink-950 active:scale-[0.98]">
            Sign in
          </button>
        </section>
      ) : !isConfigured ? (
        <section className="mt-5 rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(22,27,31,0.92),rgba(13,15,18,0.96))] p-5 text-center text-sm text-neutral-400">
          The global leaderboard is unavailable because cloud accounts are not configured.
        </section>
      ) : !online ? (
        <section className="mt-5 rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(22,27,31,0.92),rgba(13,15,18,0.96))] p-5 text-center text-sm text-neutral-400">
          Connect to the internet to load the live leaderboard. Your personal focus tracking still works offline.
        </section>
      ) : (
        <>
          <section className="relative mt-5 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(22,27,31,0.92),rgba(13,15,18,0.96))] p-5 shadow-[0_18px_42px_-28px_rgba(0,0,0,0.95)] transition-all hover:border-white/[0.12]">
            <h2 className="font-sans text-sm font-semibold text-white">
              {optedIn ? 'You’re on the board' : 'Join the global board'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              Only your chosen alias and weekly total are shown. Your name, email, and individual sessions are never displayed.
              You can leave whenever you like.
            </p>
            <form onSubmit={handleSave} className="relative mt-4">
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
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.05] placeholder:text-neutral-600"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-gradient-to-r from-ember-400 to-ember-600 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-transform active:scale-[0.98] disabled:opacity-50">
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

          {optedIn && currentUserEntry && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="relative mt-6 overflow-hidden rounded-[24px] border border-white/[0.1] bg-[#111518] p-4 transition-colors hover:border-white/[0.16] sm:p-5">
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Weekly league</p>
                  {currentUserEntry.promoted && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
                      <ChevronUpIcon className="h-3 w-3" /> Promoted
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3.5">
                  <motion.div
                    initial={{ scale: 0.75, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.12 }}
                    className={`flex h-[3.5rem] w-[3.5rem] flex-shrink-0 items-center justify-center rounded-2xl border ${leagueStyle.tile}`}>
                    <CrownIcon className={`h-7 w-7 ${leagueStyle.color}`} strokeWidth={1.8} />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <h2 className={`font-display text-[1.7rem] leading-tight tracking-[-0.04em] ${leagueStyle.color}`}>
                      {LEAGUE_NAMES[currentUserEntry.leagueTier - 1]}
                    </h2>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Division {String(currentUserEntry.leagueTier).padStart(2, '0')} <span className="px-1 text-neutral-600">/</span> {String(LEAGUE_NAMES.length).padStart(2, '0')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Rank</p>
                    <p className="mt-0.5 font-numeric text-xl font-semibold leading-none tabular-nums text-white">
                      <span className={leagueStyle.color}>#</span>{currentUserEntry.leagueRank}
                      <span className="ml-1 text-xs font-medium text-neutral-500">/ {currentUserEntry.leagueSize}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">League path</p>
                    <p className="font-numeric text-[10px] font-medium tabular-nums text-neutral-500">
                      {String(currentUserEntry.leagueTier).padStart(2, '0')} <span className="text-neutral-700">/</span> {String(LEAGUE_NAMES.length).padStart(2, '0')}
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5" aria-label="Weekly league progression">
                    {LEAGUE_NAMES.map((name, index) => {
                      const tier = index + 1;
                      const completed = tier < currentUserEntry.leagueTier;
                      const active = tier === currentUserEntry.leagueTier;
                      const tierStyle = LEAGUE_STYLES[index];
                      return (
                        <div
                          key={name}
                          aria-current={active ? 'step' : undefined}
                          aria-label={`${name} league${completed ? ', reached' : active ? ', current league' : ', upcoming'}`}
                          className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-0.5 py-2 transition-colors sm:py-2.5 ${
                            active
                              ? tierStyle.tile
                              : completed
                                ? 'border-white/[0.08] bg-white/[0.045] text-neutral-200'
                                : 'border-white/[0.055] bg-black/15 text-neutral-600'
                          }`}>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            active
                              ? `${tierStyle.icon} ${tierStyle.color}`
                              : completed
                                ? 'bg-white/[0.09] text-neutral-200'
                                : 'bg-white/[0.04] text-neutral-600'
                          }`}>
                            {completed ? (
                              <CheckIcon aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                            ) : active ? (
                              <CrownIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                            ) : (
                              <LockIcon aria-hidden="true" className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className={`w-full truncate text-center text-[9px] font-semibold leading-tight ${
                            active ? tierStyle.color : completed ? 'text-neutral-300' : 'text-neutral-600'
                          }`}>
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-500">This week</p>
                      <p className={`mt-1 text-xs font-medium leading-5 ${
                        currentUserEntry.promoted ? 'text-emerald-200' : 'text-neutral-300'
                      }`}>{leagueMessage}</p>
                    </div>
                    {currentUserEntry.leagueSize < 3 && currentUserEntry.leagueTier < LEAGUE_NAMES.length && !currentUserEntry.promoted ? (
                      <span className="flex-shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-[9px] font-semibold text-emerald-200">
                        Everyone advances
                      </span>
                    ) : currentUserEntry.leagueSize >= 5 && currentUserEntry.leagueTier < LEAGUE_NAMES.length ? (
                      <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
                        currentUserEntry.leagueRank <= promotionCutoff
                          ? 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200'
                          : 'border-white/[0.08] bg-white/[0.04] text-neutral-400'
                      }`}>
                        {currentUserEntry.leagueRank <= promotionCutoff ? 'Promotion spot' : `${promotionCutoff} advance`}
                      </span>
                    ) : null}
                  </div>
                  {currentUserEntry.leagueSize >= 5 && currentUserEntry.leagueTier < LEAGUE_NAMES.length && (
                    <div className="mt-3">
                      <div
                        role="progressbar"
                        aria-label="Weekly league standing"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(leagueProgress)}
                        className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <span className="absolute inset-y-0 right-0 w-[20%] rounded-r-full bg-emerald-300/20" />
                        {currentUserEntry.leagueTier > 1 && (
                          <span className="absolute inset-y-0 left-0 w-[20%] bg-rose-300/10" />
                        )}
                        <motion.span
                          initial={{ width: 0 }}
                          animate={{ width: `${leagueProgress}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                          className="absolute inset-y-0 left-0 rounded-full bg-ember-400"
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[9px] text-neutral-600">
                        {currentUserEntry.leagueTier > 1 && <span>Relegation</span>}
                        <span className="ml-auto">Promotion</span>
                      </div>
                    </div>
                  )}
                  {currentUserEntry.leagueSize < 3 && currentUserEntry.leagueTier === LEAGUE_NAMES.length && (
                    <p className="mt-2 text-[10px] text-neutral-500">Diamond is the highest league.</p>
                  )}
                </div>
                <p className="mt-3 text-center text-[10px] text-neutral-500">
                  Minutes refresh after each focus session <span className="px-1 text-neutral-700">·</span> New standings every Monday
                </p>
              </div>
            </motion.section>
          )}

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-wide text-neutral-500">This week</h2>
              <span className="text-xs text-neutral-500">Minutes · UTC</span>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(22,27,31,0.92),rgba(13,15,18,0.96))] shadow-[0_18px_42px_-28px_rgba(0,0,0,0.95)]">
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
                    <motion.li
                      key={`${entry.rank}-${entry.alias}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(entry.rank, 8) * 0.035 }}
                      className={`relative flex items-center gap-3 px-4 py-3.5 transition-colors ${
                        entry.isCurrentUser
                          ? 'bg-gradient-to-r from-ember-400/[0.13] via-amber-300/[0.07] to-transparent'
                          : 'hover:bg-white/[0.025]'
                      }`}>
                      <span className={`w-7 text-center text-sm font-bold tabular-nums ${entry.rank === 1 ? 'text-amber-200' : entry.rank <= 3 ? 'text-ember-300' : 'text-neutral-500'}`}>
                        {entry.rank <= 3 ? <RankCrown rank={entry.rank} className="mx-auto h-4 w-4" /> : entry.rank}
                      </span>
                      <Avatar
                        value={entry.avatarUrl}
                        alt={`${entry.alias} avatar`}
                        className={`h-9 w-9 flex-shrink-0 rounded-xl ring-1 ${
                          entry.isCurrentUser ? 'ring-ember-300/50' : 'ring-white/10'
                        }`}
                      />
                      <span className={`min-w-0 flex-1 truncate text-sm ${entry.isCurrentUser ? 'font-semibold text-white' : 'text-neutral-300'}`}>
                        {entry.alias}
                        {entry.isCurrentUser && <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-ember-300">You</span>}
                      </span>
                      <span className={`flex-shrink-0 text-sm font-semibold tabular-nums ${
                        entry.isCurrentUser ? 'text-amber-100' : 'text-neutral-300'
                      }`}>
                        {formatFocusTime(entry.focusSeconds)}
                      </span>
                    </motion.li>
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
