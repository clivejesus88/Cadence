import { useEffect, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { SessionSetup } from '../components/focus/SessionSetup';
import { ActiveSession } from '../components/focus/ActiveSession';
import { SessionComplete } from '../components/focus/SessionComplete';
import { ambientSounds } from '../data/ambientSounds';
import { Screen } from '../components/ui/Screen';

type Phase = 'setup' | 'running' | 'complete';
type SessionKind = 'focus' | 'break';

export function Focus() {
  const { logSession, activeTaskId, tasks } = useAppData();
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionType, setSessionType] = useState<SessionKind>('focus');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [soundId, setSoundId] = useState(ambientSounds[0].id);
  const [blockingEnabled, setBlockingEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [completedMinutes, setCompletedMinutes] = useState(0);

  useEffect(() => {
    if (phase !== 'running' || isPaused || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, isPaused, secondsLeft]);

  useEffect(() => {
    if (phase !== 'running' || secondsLeft !== 0) return;
    if (sessionType === 'focus') {
      logSession(durationMinutes, activeTaskId ?? undefined);
      setCompletedMinutes(durationMinutes);
      setPhase('complete');
    } else {
      setPhase('setup');
      setSessionType('focus');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  const startSession = (minutes: number) => {
    setDurationMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setPhase('running');
  };

  const startBreak = () => {
    setSessionType('break');
    setSecondsLeft(5 * 60);
    setPhase('running');
  };

  const goSetup = () => {
    setPhase('setup');
    setSessionType('focus');
    setBlockingEnabled(true);
  };

  const endSession = () => {
    logSession(durationMinutes, activeTaskId ?? undefined);
    setCompletedMinutes(durationMinutes);
    setPhase('complete');
  };

  const togglePause = () => setIsPaused((p) => !p);

  if (phase === 'setup') {
    return (
      <Screen>
        <SessionSetup
          durationMinutes={durationMinutes}
          onChangeDuration={setDurationMinutes}
          soundId={soundId}
          onChangeSound={setSoundId}
          blockingEnabled={blockingEnabled}
          onToggleBlocking={setBlockingEnabled}
          activeTask={activeTask}
          onStart={() => startSession(durationMinutes)}
        />
      </Screen>
    );
  }

  if (phase === 'running') {
    return (
      <Screen scroll={false}>
        <ActiveSession
          sessionType={sessionType}
          secondsLeft={secondsLeft}
          totalSeconds={durationMinutes * 60}
          isPaused={isPaused}
          onTogglePause={togglePause}
          onEnd={endSession}
          soundId={soundId}
          blockingEnabled={blockingEnabled}
          activeTask={activeTask}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <SessionComplete minutes={completedMinutes} onBreak={startBreak} onDone={goSetup} />
    </Screen>
  );
}
