import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { SessionSetup } from '../components/focus/SessionSetup';
import { ActiveSession } from '../components/focus/ActiveSession';
import { SessionComplete } from '../components/focus/SessionComplete';
import { FocusShield } from '../components/focus/FocusShield';
import { ambientSounds } from '../data/ambientSounds';
import { startSound, stopSound } from '../utils/audio';
import {
  notifySessionStarted,
  notifySessionPaused,
  notifySessionResumed,
  notifyOvertime,
  notifyBreakStarted,
  notifyBreakEnded,
  notifyDailyCapReached } from
'../utils/notify';

type Phase = 'setup' | 'running' | 'complete';
type SessionKind = 'focus' | 'break';

const MAX_SESSION_SECONDS = 24 * 60 * 60; // a focus session can run for hours, but never past a full day
const MIN_LOGGABLE_SECONDS = 60; // ending almost instantly shouldn't count as a session

export function Focus() {
  const { logSession, activeTaskId, tasks } = useAppData();
  const { preferences } = useSettings();
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionType, setSessionType] = useState<SessionKind>('focus');
  const [durationMinutes, setDurationMinutes] = useState(preferences.defaultDuration);
  const [targetSeconds, setTargetSeconds] = useState(preferences.defaultDuration * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundId, setSoundId] = useState(ambientSounds[0].id);
  const [blockingEnabled, setBlockingEnabled] = useState(preferences.blockDuringFocus);
  const [isPaused, setIsPaused] = useState(false);
  const [completedMinutes, setCompletedMinutes] = useState(0);
  const [shielded, setShielded] = useState(false);
  const [resumeSeconds, setResumeSeconds] = useState(() => Number(localStorage.getItem('cadence.resumeSeconds') ?? 0));
  const overtimeNotifiedRef = useRef(false);

  const saveResume = useCallback((seconds: number) => {
    setResumeSeconds(seconds);
    if (seconds > 0) localStorage.setItem('cadence.resumeSeconds', String(seconds));
    else localStorage.removeItem('cadence.resumeSeconds');
  }, []);

  // Wall-clock timing instead of tick counting: elapsed is derived from
  // Date.now() minus accumulated pause time, so background tabs and throttled
  // intervals stay accurate. The interval below only forces re-renders.
  const startedAtRef = useRef<number | null>(null);
  const pausedTotalRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const activeTaskIdRef = useRef(activeTaskId);
  const logSessionRef = useRef(logSession);

  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  useEffect(() => {
    logSessionRef.current = logSession;
  }, [logSession]);

  useEffect(() => () => stopSound(), []);

  const shieldActive = phase === 'running' && sessionType === 'focus' && blockingEnabled;

  useEffect(() => {
    if (!shieldActive) {
      setShielded(false);
      return;
    }
    const onBlur = () => setShielded(true);
    const onVisibility = () => {
      if (document.hidden) setShielded(true);
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [shieldActive]);

  const computeElapsed = useCallback((): number => {
    if (startedAtRef.current == null) return 0;
    const now = Date.now();
    const pausedMs = pausedTotalRef.current + (pauseStartedAtRef.current != null ? now - pauseStartedAtRef.current : 0);
    return Math.max(0, Math.floor((now - startedAtRef.current - pausedMs) / 1000));
  }, []);

  // Re-render tick — only while actively running.
  useEffect(() => {
    if (phase !== 'running' || isPaused) return;
    const id = setInterval(() => {
      setElapsedSeconds(computeElapsed());
    }, 500);
    return () => clearInterval(id);
  }, [phase, isPaused, computeElapsed]);

  // Break auto-end, overtime nudge, and the 24h hard cap.
  useEffect(() => {
    if (phase !== 'running') return;

    if (sessionType === 'break') {
      if (elapsedSeconds >= targetSeconds) {
        notifyBreakEnded();
        setElapsedSeconds(0);
        startedAtRef.current = null;
        setPhase('setup');
        setSessionType('focus');
      }
      return;
    }

    if (!overtimeNotifiedRef.current && elapsedSeconds >= targetSeconds) {
      overtimeNotifiedRef.current = true;
      notifyOvertime();
    }

    if (elapsedSeconds >= MAX_SESSION_SECONDS) {
      const minutes = Math.round(MAX_SESSION_SECONDS / 60);
      notifyDailyCapReached();
      stopSound();
      logSessionRef.current(minutes, activeTaskIdRef.current ?? undefined);
      setCompletedMinutes(minutes);
      setElapsedSeconds(0);
      startedAtRef.current = null;
      setPhase('complete');
    }
  }, [elapsedSeconds, phase, sessionType, targetSeconds]);

  const startSession = (minutes: number) => {
    overtimeNotifiedRef.current = false;
    setDurationMinutes(minutes);
    setTargetSeconds(Math.min(minutes * 60, MAX_SESSION_SECONDS));
    const resume = resumeSeconds > 0 ? Math.min(Math.floor(resumeSeconds), MAX_SESSION_SECONDS) : 0;
    if (resume >= minutes * 60) overtimeNotifiedRef.current = true;
    setElapsedSeconds(resume);
    startedAtRef.current = Date.now() - resume * 1000;
    pausedTotalRef.current = 0;
    pauseStartedAtRef.current = null;
    saveResume(0);
    setSessionType('focus');
    setIsPaused(false);
    setPhase('running');
    startSound(soundId);
    notifySessionStarted(minutes, blockingEnabled);
  };

  const startBreak = () => {
    stopSound();
    setTargetSeconds(Math.max(60, preferences.breakLength * 60));
    setElapsedSeconds(0);
    startedAtRef.current = Date.now();
    pausedTotalRef.current = 0;
    pauseStartedAtRef.current = null;
    setSessionType('break');
    setIsPaused(false);
    setPhase('running');
    notifyBreakStarted(preferences.breakLength);
  };

  const togglePause = () => {
    const now = Date.now();
    if (isPaused) {
      pausedTotalRef.current += now - (pauseStartedAtRef.current ?? now);
      pauseStartedAtRef.current = null;
      if (sessionType === 'focus') notifySessionResumed();
    } else {
      pauseStartedAtRef.current = now;
      setElapsedSeconds(computeElapsed());
      if (sessionType === 'focus') notifySessionPaused();
    }
    setIsPaused(!isPaused);
  };

  const endSession = () => {
    if (sessionType === 'break') {
      stopSound();
      setElapsedSeconds(0);
      startedAtRef.current = null;
      setPhase('setup');
      setSessionType('focus');
      return;
    }

    stopSound();
    if (elapsedSeconds >= MIN_LOGGABLE_SECONDS) {
      if (elapsedSeconds < targetSeconds) {
        // Stopped partway — keep the progress so the next session can resume here.
        saveResume(elapsedSeconds);
        startedAtRef.current = null;
        pausedTotalRef.current = 0;
        pauseStartedAtRef.current = null;
        setElapsedSeconds(elapsedSeconds);
        setPhase('setup');
        return;
      }
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      logSession(minutes, activeTaskId ?? undefined);
      setCompletedMinutes(minutes);
      startedAtRef.current = null;
      saveResume(0);
      if (preferences.autoStartBreaks) {
        startBreak();
        return;
      }
      setElapsedSeconds(0);
      setPhase('complete');
    } else {
      saveResume(0);
      setElapsedSeconds(0);
      startedAtRef.current = null;
      setPhase('setup');
    }
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  if (phase === 'setup') {
    return (
      <SessionSetup
        durationMinutes={durationMinutes}
        onChangeDuration={setDurationMinutes}
        soundId={soundId}
        onChangeSound={setSoundId}
        blockingEnabled={blockingEnabled}
        onToggleBlocking={setBlockingEnabled}
        activeTask={activeTask}
        resumeSeconds={resumeSeconds}
        onDiscardResume={() => saveResume(0)}
        onStart={() => startSession(durationMinutes)} />);
  }

  if (phase === 'running') {
    return (
      <>
        <ActiveSession
          sessionType={sessionType}
          elapsedSeconds={elapsedSeconds}
          targetSeconds={targetSeconds}
          isPaused={isPaused}
          onTogglePause={togglePause}
          onEnd={endSession}
          strictMode={preferences.strictMode}
          soundId={soundId}
          blockingEnabled={blockingEnabled && sessionType === 'focus'}
          activeTask={activeTask} />
        <FocusShield
          visible={shielded}
          taskTitle={activeTask?.title}
          onContinue={() => setShielded(false)}
          onEndSession={endSession} />
      </>
    );
  }

  return <SessionComplete minutes={completedMinutes} breakMinutes={preferences.breakLength} onBreak={startBreak} onDone={endSession} />;
}