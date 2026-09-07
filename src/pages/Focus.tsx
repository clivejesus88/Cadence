import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { SessionSetup } from '../components/focus/SessionSetup';
import { ActiveSession } from '../components/focus/ActiveSession';
import { SessionComplete } from '../components/focus/SessionComplete';
import { ambientSounds } from '../data/ambientSounds';
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
const BREAK_SECONDS = 5 * 60;
const MIN_LOGGABLE_SECONDS = 60; // ending almost instantly shouldn't count as a session

export function Focus() {
  const { logSession, activeTaskId, tasks } = useAppData();
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionType, setSessionType] = useState<SessionKind>('focus');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [targetSeconds, setTargetSeconds] = useState(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundId, setSoundId] = useState(ambientSounds[0].id);
  const [blockingEnabled, setBlockingEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [completedMinutes, setCompletedMinutes] = useState(0);
  const overtimeNotifiedRef = useRef(false);

  // A single interval per running/paused state — never recreated every tick, so long
  // sessions stay accurate for hours instead of drifting or churning timers.
  useEffect(() => {
    if (phase !== 'running' || isPaused) return;
    const id = setInterval(() => {
      setElapsedSeconds((s) => s >= MAX_SESSION_SECONDS ? s : s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, isPaused]);

  // Breaks are fixed-length and end themselves. Focus sessions only stop at the 24h hard cap —
  // going past the chosen duration just rolls into bonus "overtime" instead of forcing a stop.
  useEffect(() => {
    if (phase !== 'running') return;

    if (sessionType === 'break') {
      if (elapsedSeconds >= targetSeconds) {
        notifyBreakEnded();
        setElapsedSeconds(0);
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
      logSession(minutes, activeTaskId ?? undefined);
      setCompletedMinutes(minutes);
      setElapsedSeconds(0);
      setPhase('complete');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, phase, sessionType, targetSeconds]);

  const startSession = (minutes: number) => {
    overtimeNotifiedRef.current = false;
    setDurationMinutes(minutes);
    setTargetSeconds(minutes * 60);
    setElapsedSeconds(0);
    setSessionType('focus');
    setIsPaused(false);
    setPhase('running');
    notifySessionStarted(minutes, blockingEnabled);
  };

  const startBreak = () => {
    setTargetSeconds(BREAK_SECONDS);
    setElapsedSeconds(0);
    setSessionType('break');
    setIsPaused(false);
    setPhase('running');
    notifyBreakStarted();
  };

  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (sessionType === 'focus') {
        if (next) {
          notifySessionPaused();
        } else {
          notifySessionResumed();
        }
      }
      return next;
    });
  };

  const endSession = () => {
    if (sessionType === 'break') {
      setElapsedSeconds(0);
      setPhase('setup');
      setSessionType('focus');
      return;
    }

    if (elapsedSeconds >= MIN_LOGGABLE_SECONDS) {
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      logSession(minutes, activeTaskId ?? undefined);
      setCompletedMinutes(minutes);
      setElapsedSeconds(0);
      setPhase('complete');
    } else {
      setElapsedSeconds(0);
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
        onStart={() => startSession(durationMinutes)} />);


  }

  if (phase === 'running') {
    return (
      <ActiveSession
        sessionType={sessionType}
        elapsedSeconds={elapsedSeconds}
        targetSeconds={targetSeconds}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onEnd={endSession}
        soundId={soundId}
        blockingEnabled={blockingEnabled && sessionType === 'focus'}
        activeTask={activeTask} />);


  }

  return <SessionComplete minutes={completedMinutes} onBreak={startBreak} onDone={endSession} />;
}