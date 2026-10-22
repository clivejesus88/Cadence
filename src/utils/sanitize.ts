import type { BlockingRule } from '../types/blocklist';

// Input sanitization helpers. React escapes JSX output, so the goal here is to
// neutralize control characters, cap lengths, and validate the two sink types
// that are not plain text: image URLs (avatar) and website lists.

// Strip NUL and other C0/C1 control characters except nothing (tab/newline are
// collapsed by normalize below), and remove Unicode bidi override characters
// that can be abused to disguise text.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
const BIDI_CHARS = /[\u202A-\u202E\u2066-\u2069]/g;

export function sanitizeText(input: unknown, maxLength = 120): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(CONTROL_CHARS, ' ')
    .replace(BIDI_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// Longer body-like text (e.g. future notes). Keeps single newlines.
export function sanitizeMultiline(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(CONTROL_CHARS, (m) => (m === '\n' ? '\n' : ' '))
    .replace(BIDI_CHARS, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(input: unknown): string {
  const value = typeof input === 'string' ? input.trim().toLowerCase() : '';
  return value.replace(CONTROL_CHARS, '').replace(BIDI_CHARS, '').slice(0, 254);
}

export function isValidEmail(input: string): boolean {
  // Deliberately simple: one @, no spaces, a dot in the domain. Supabase is the
  // authoritative validator for sign-in/up.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;
const SAFE_IMAGE_PATH = /^\/[a-z0-9/_\-.%]+\.(png|jpe?g|webp|gif)$/i;
const HTTPS_URL = /^https:\/\/[^\s]+$/i;

/**
 * Sanitizes a stored avatar value. Preset tokens ("preset:<id>") pass through.
 * Otherwise only same-origin image paths, https image URLs, or base64 image data
 * URLs are accepted — anything else (javascript:, data:text/html, etc.) is
 * rejected and returns an empty string so the renderer falls back to a preset.
 */
export function sanitizeAvatarUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  const value = input.trim().replace(CONTROL_CHARS, '').replace(BIDI_CHARS, '');
  if (value.length === 0) return '';
  if (value.startsWith('preset:')) return value;
  if (value.length > 2_000_000) return ''; // ~2MB data URL ceiling
  if (IMAGE_DATA_URL.test(value)) return value;
  if (SAFE_IMAGE_PATH.test(value)) return value;
  if (HTTPS_URL.test(value)) return value;
  return '';
}

/**
 * Normalizes a single website/domain entry from the distraction plan. Accepts
 * "example.com", "www.example.com", "https://example.com/path" and reduces to a
 * bare lowercased hostname. Returns null if it cannot be parsed as a hostname.
 */
export function sanitizeDomain(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let value = input.trim().toLowerCase().replace(CONTROL_CHARS, '').replace(BIDI_CHARS, '');
  if (value.length === 0) return null;
  // Drop any scheme and path to get at the host.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.replace(/^www\./, '');
  value = value.split(/[/?#]/)[0];
  value = value.split(':')[0]; // strip port
  // Hostname: labels of [a-z0-9-], separated by dots, at least one dot, TLD >= 2.
  const hostname = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  return hostname.test(value) ? value : null;
}

export function sanitizeDomains(input: unknown): string[] {
  if (typeof input !== 'string') return [];
  const seen = new Set<string>();
  for (const part of input.split(/[,\n]/)) {
    const domain = sanitizeDomain(part);
    if (domain) seen.add(domain);
  }
  return Array.from(seen).slice(0, 50);
}

/**
 * Normalizes blocking rules from any source (local UI or remote sync) so stored
 * values stay within bounds and websites remain clean hostnames.
 */
export function sanitizeBlockingRules(rules: unknown): BlockingRule[] {
  if (!Array.isArray(rules)) return [];
  return rules
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
    .slice(0, 100)
    .map((r) => {
      const kind = r.kind === 'app' || r.kind === 'schedule' || r.kind === 'website' ? r.kind : 'website';
      const appIds = Array.isArray(r.appIds)
        ? r.appIds.map((a) => sanitizeText(a, 60)).filter(Boolean).slice(0, 50)
        : undefined;
      const websites = Array.isArray(r.websites) ? sanitizeDomains(r.websites.join(',')) : undefined;
      const days = Array.isArray(r.days)
        ? r.days
            .filter((d) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
            .slice(0, 7)
            .map((d) => d as number)
        : undefined;
      return {
        id: sanitizeText(r.id, 60),
        kind,
        title: sanitizeText(r.title, 80),
        enabled: Boolean(r.enabled),
        appIds,
        websites,
        days,
        start: r.start ? sanitizeText(r.start, 5) : undefined,
        end: r.end ? sanitizeText(r.end, 5) : undefined,
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now()
      };
    });
}
