import { supabase, isSupabaseConfigured } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return buffer;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function persistSubscription(sub: PushSubscription, userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh ?? '',
      auth: keys.auth ?? '',
      user_agent: navigator.userAgent.slice(0, 300)
    },
    { onConflict: 'endpoint' }
  );
}

/**
 * Requests notification permission (must be called from a user gesture) and
 * subscribes this device to Web Push. Returns true on success.
 */
export async function enablePush(userId: string): Promise<boolean> {
  if (!pushSupported()) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY is not set');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const registration = await getRegistration();
  if (!registration) return false;

  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  await persistSubscription(sub, userId);
  return true;
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const registration = await getRegistration();
  if (!registration) return;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    // proceed to delete server-side row regardless
  }
  if (isSupabaseConfigured && supabase) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
}

/**
 * Re-sync the current device subscription with the server (e.g. after sign-in
 * or when permission was already granted on a previous visit).
 */
export async function syncPushSubscription(userId: string): Promise<void> {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return;
  if (Notification.permission !== 'granted') return;
  const registration = await getRegistration();
  if (!registration) return;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;
  await persistSubscription(sub, userId);
}
