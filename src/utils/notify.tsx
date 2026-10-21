
import { toast } from 'sonner';
import { TimerIcon, PauseIcon, PlayIcon, CoffeeIcon, TrophyIcon, AlertTriangleIcon, BellIcon, SunIcon, LifeBuoyIcon, ListChecksIcon, ShieldCheckIcon, CrownIcon, AwardIcon, TargetIcon } from 'lucide-react';
import { SessionToast } from '../components/notifications/SessionToast';
import { formatMinutes } from './time';

export function notifySessionStarted(minutes: number, blockingEnabled: boolean) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={blockingEnabled ? ShieldCheckIcon : TimerIcon}
      title="Focus session started"
      description={`${formatMinutes(minutes)} · ${blockingEnabled ? 'Stay off distractions' : 'Distraction plan off'}`} />,


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
  toast.custom(
    (id) => <SessionToast id={id} icon={PlayIcon} title="Back to focus" description="Your timer is running again." />,
    { duration: 2000 }
  );
}

export function notifyOvertime() {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={TrophyIcon}
      title="Goal reached!"
      description="You're in bonus time now — keep going or wrap up."
      tone="success" />,


    { duration: 3500 }
  );
}

export function notifyBreakStarted(minutes: number) {
  toast.custom(
    (id) => <SessionToast id={id} icon={CoffeeIcon} title="Break started" description={`${minutes} minutes to recharge.`} tone="info" />,
    { duration: 2500 }
  );
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
  toast.custom(
    (id) => <SessionToast id={id} icon={TimerIcon} title="Break's over" description="Ready to refocus?" />,
    { duration: 2500 }
  );
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

export function notifyTaskReminders(overdueCount: number, todayCount: number, firstTitle: string) {
  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
  if (todayCount > 0) parts.push(`${todayCount} due today`);
  if (parts.length === 0) return;
  const description = firstTitle ? `${parts.join(' · ')} — first up: ${firstTitle}` : parts.join(' · ');
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={ListChecksIcon}
      title="Tasks to do today"
      description={description}
      tone="warning" />,


    { duration: 6000 }
  );
}

export function notifySupport() {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={LifeBuoyIcon}
      title="Cadence support"
      description="Reach us any time at support@cadence.app — we usually reply within a day."
      tone="info" />,


    { duration: 4500 }
  );
}

export function notifyUpgrade(feature: string) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={ShieldCheckIcon}
      title="Unlock this with Pro"
      description={feature}
      tone="ember" />,


    { duration: 4000 }
  );
}

export function notifyError(title: string, description?: string) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={AlertTriangleIcon}
      title={title}
      description={description}
      tone="warning" />,


    { duration: 4500 }
  );
}

export function notifyLevelUp(level: number, title: string) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={CrownIcon}
      title={`Level ${level} — ${title}`}
      description="New level reached. Keep the momentum going."
      tone="ember" />,


    { duration: 5000 }
  );
}

export function notifyBadgeEarned(name: string, description: string) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={AwardIcon}
      title={`Badge unlocked: ${name}`}
      description={description}
      tone="success" />,


    { duration: 5000 }
  );
}

export function notifyGoalMet(goalMinutes: number) {
  toast.custom(
    (id) =>
    <SessionToast
      id={id}
      icon={TargetIcon}
      title="Daily goal complete"
      description={`You hit ${formatMinutes(goalMinutes)} of focus today. Nicely done.`}
      tone="success" />,


    { duration: 5000 }
  );
}
