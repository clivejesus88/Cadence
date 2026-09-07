
import { toast } from 'sonner';
import { TimerIcon, PauseIcon, PlayIcon, CoffeeIcon, SparklesIcon, AlertTriangleIcon } from 'lucide-react';
import { SessionToast } from '../components/notifications/SessionToast';
import { formatMinutes } from './time';

export function notifySessionStarted(minutes: number, blockingEnabled: boolean) {
  toast.custom(
    () =>
    <SessionToast
      icon={TimerIcon}
      title="Focus session started"
      description={`${formatMinutes(minutes)} · ${blockingEnabled ? 'Distractions blocked' : 'Distractions allowed'}`} />,


    { duration: 3000 }
  );
}

export function notifySessionPaused() {
  toast.custom(
    () => <SessionToast icon={PauseIcon} title="Session paused" description="Resume whenever you're ready." tone="warning" />,
    { duration: 2500 }
  );
}

export function notifySessionResumed() {
  toast.custom(() => <SessionToast icon={PlayIcon} title="Back to focus" />, { duration: 2000 });
}

export function notifyOvertime() {
  toast.custom(
    () =>
    <SessionToast
      icon={SparklesIcon}
      title="Goal reached!"
      description="You're in bonus time now — keep going or wrap up."
      tone="success" />,


    { duration: 3500 }
  );
}

export function notifyBreakStarted() {
  toast.custom(() => <SessionToast icon={CoffeeIcon} title="Break started" description="5 minutes to recharge." />, {
    duration: 2500
  });
}

export function notifyBreakEnded() {
  toast.custom(() => <SessionToast icon={TimerIcon} title="Break's over" description="Ready to refocus?" />, {
    duration: 2500
  });
}

export function notifyDailyCapReached() {
  toast.custom(
    () =>
    <SessionToast
      icon={AlertTriangleIcon}
      title="24-hour limit reached"
      description="We ended your session automatically. Time for real rest."
      tone="warning" />,


    { duration: 4500 }
  );
}