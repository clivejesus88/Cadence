// Lightweight client-side rate limiting to blunt brute-force and accidental
// hammering (auth attempts, checkout). This is a UX/defense-in-depth layer; the
// authoritative limits live server-side (Supabase Auth + edge functions).

const PREFIX = 'cadence:rl:';

interface Bucket {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

function readBucket(key: string): Bucket | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Bucket;
    if (typeof parsed.count !== 'number' || typeof parsed.windowStart !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeBucket(key: string, bucket: Bucket): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(bucket));
  } catch {
    // storage unavailable — limiting degrades to per-page-session only
  }
}

/**
 * Consumes one token for `key`. Allows `max` attempts per `windowMs`; once the
 * limit is hit, locks for `lockMs` before allowing another attempt.
 */
export function consume(
  key: string,
  { max, windowMs, lockMs }: { max: number; windowMs: number; lockMs: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = readBucket(key) ?? { count: 0, windowStart: now, lockedUntil: 0 };

  if (bucket.lockedUntil > now) {
    return { allowed: false, retryAfterMs: bucket.lockedUntil - now };
  }

  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  bucket.count += 1;

  if (bucket.count > max) {
    bucket.lockedUntil = now + lockMs;
    bucket.count = 0;
    bucket.windowStart = now;
    writeBucket(key, bucket);
    return { allowed: false, retryAfterMs: lockMs };
  }

  writeBucket(key, bucket);
  return { allowed: true, retryAfterMs: 0 };
}

export function reset(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export function formatRetry(retryAfterMs: number): string {
  const seconds = Math.ceil(retryAfterMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

// Preset policies.
export const AUTH_LIMIT = { max: 5, windowMs: 60_000, lockMs: 60_000 };
export const CHECKOUT_LIMIT = { max: 5, windowMs: 60_000, lockMs: 30_000 };
