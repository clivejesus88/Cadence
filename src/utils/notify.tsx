
import { toast } from 'sonner';
import { TimerIcon, PauseIcon, PlayIcon, CoffeeIcon, SparklesIcon, AlertTriangleIcon, BellIcon, SunIcon, LifeBuoyIcon } from 'lucide-react';
import { SessionToast } from '../components/notifications/SessionToast';
import { formatMinutes } from './time';

export function notifySessionStarted(minutes: number, blockingEnabled: boolean) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={TimerIcon}
      title="Focus session started"
      description={`${formatMinutes(minutes)} · ${blockingEnabled ? 'Distractions blocked' : 'Distractions allowed'}`} />,


    { duration: 3000 }
  );
}

export function notifySessionPaused() {
  toast.custom(
    (id) => <SessionToast id={id} icon={PauseIcon} title="Session paused" description="Resume whenever you're ready." tone="warning" />,
    { duration: 2500 }
  );
}

export function notifySessionResumed() {
  toast.custom((id) => <SessionToast id={id} icon={PlayIcon} title="Back to focus" />, { duration: 2000 });
}

export function notifyOvertime() {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={SparklesIcon}
      title="Goal reached!"
      description="You're in bonus time now — keep going or wrap up."
      tone="success" />,


    { duration: 3500 }
  );
}

export function notifyBreakStarted(minutes: number) {
  toast.custom((id) => <SessionToast id={id} icon={CoffeeIcon} title="Break started" description={`${minutes} minutes to recharge.`} />, {
    duration: 2500
  });
}

export function notifySessionReminder() {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={BellIcon}
      title="Ready to focus?"
      description="You haven't logged a session today. A few minutes still count."
      tone="warning" />,


    { duration: 5000 }
  );
}

export function notifyDailySummary(totalMinutes: number, sessionCount: number) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={SunIcon}
      title="Today at a glance"
      description={`You focused ${formatMinutes(totalMinutes)} across ${sessionCount} session${sessionCount === 1 ? '' : 's'}.`} />,


    { duration: 6000 }
  );
}

export function notifyBreakEnded() {
  toast.custom((id) => <SessionToast id={id} icon={TimerIcon} title="Break's over" description="Ready to refocus?" />, {
    duration: 2500
  });
}

export function notifyDailyCapReached() {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={AlertTriangleIcon}
      title="24-hour limit reached"
      description="We ended your session automatically. Time for real rest."
      tone="warning" />,


    { duration: 4500 }
  );
}

export function notifySupport() {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={LifeBuoyIcon}
      title="Cadence support"
      description="Reach us any time at support@cadence.app — we usually reply within a day." />,


    { duration: 4500 }
  );
}