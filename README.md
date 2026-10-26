# Cadence

A mobile-first focus timer for students — offline-first React PWA with accounts,
cloud sync, ambient sounds, gamified progress, a distraction plan, and real push
reminders.

## Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS 3, framer-motion
- **Data**: Dexie (IndexedDB) offline-first store with last-write-wins sync
- **Backend**: Supabase (Postgres + Auth + Row-Level Security + Edge Functions)
- **Payments**: RevenueCat Web Billing with server-verified subscription webhooks
- **PWA**: `vite-plugin-pwa` (Workbox service worker + manifest)
- **Notifications**: self-hosted Web Push (VAPID) via Supabase Edge Functions + pg_cron
- **Monitoring**: Sentry (client + edge functions)

## Local development

```bash
npm install
cp .env.example .env      # fill in the VITE_* values
npm run dev               # http://localhost:5173
```

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset, the app runs in
local-only mode (no accounts, no sync).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (emits the service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Environment variables

See `.env.example`. Browser vars are prefixed `VITE_`. Supabase Edge Function
secrets are set with `supabase secrets set` and are documented in the same file.

## Database

Migrations live in `supabase/migrations` and must be applied to the project
before signed-in sync will work.

```bash
supabase link --project-ref <ref>
supabase db push          # applies 0001..00X
```

Or paste each file into the Supabase SQL editor in order.

| Migration | Purpose |
| --- | --- |
| `0001_init` | tasks / focus_sessions / preferences / profile + RLS |
| `002_task_reminders` | task reminder preference |
| `003_blocking_rules` | blocking rules preference |
| `004_subscriptions` | subscription records (initially PayPal) |
| `005_payment_security` | client cannot self-assign Pro |
| `006_daily_goal` | daily goal preference |
| `007_push` | push subscriptions + profile timezone |
| `008_reminder_cron` | schedules the hourly reminder dispatcher |
| `009_rate_limits` | server-side rate limiting for Edge Functions |
| `010_revenuecat` | RevenueCat subscription metadata and webhook event tracking |
| `011_revenuecat_atomic_events` | atomically orders and applies RevenueCat webhook events |

## Edge functions

```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy send-push
supabase functions deploy dispatch-reminders
```

Set secrets first (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`,
`REVENUECAT_WEBHOOK_AUTHORIZATION`, `REVENUECAT_PRO_ENTITLEMENT_ID`,
`VAPID_*`, `CRON_SECRET`). Set `VITE_REVENUECAT_WEB_API_KEY` in Vercel.

In RevenueCat, connect Stripe to a Web Billing app, create monthly and annual
products, and attach them to the current offering using the predefined
`$rc_monthly` and `$rc_annual` package identifiers. Grant both products the
`pro` entitlement. Configure a
webhook to `https://<ref>.supabase.co/functions/v1/revenuecat-webhook` and set
its Authorization header to the exact value stored in
`REVENUECAT_WEBHOOK_AUTHORIZATION`.

The PayPal webhook remains available for subscriptions sold before the
RevenueCat migration; new checkout uses RevenueCat.

## Push notifications (Web Push)

Cadence sends real push reminders via a service worker + Supabase, no third
party.

1. **Generate a VAPID keypair** (once):

   ```bash
   npx web-push generate-vapid-keys
   ```

   - Public key → `VITE_VAPID_PUBLIC_KEY` (browser) **and** `VAPID_PUBLIC_KEY` (edge secret)
   - Private key → `VAPID_PRIVATE_KEY` (edge secret only)
   - `VAPID_SUBJECT` → `mailto:` address

2. Users enable reminders in **Profile → Notifications**; the browser asks for
   permission from that gesture and the device subscription is stored in
   `push_subscriptions`.

3. Schedule the dispatcher (hourly) — see `supabase/migrations/008_reminder_cron.sql`.
   Fixed schedule: session nudge at 16:00 local, evening summary at 18:00 local.
   `reminder_log` prevents duplicate sends.

4. **iOS**: Web Push requires iOS 16.4+, the app **installed to the home screen**,
   and permission granted from a tap. Android/Chrome works from the browser tab.


## Deploy

The app is deployed on Vercel (SPA rewrites in `vercel.json`). Set the `VITE_*`
variables, including `VITE_REVENUECAT_WEB_API_KEY`, in the Vercel project, then
deploy.

## Architecture notes

- **Offline-first**: all reads/writes hit IndexedDB; a sync queue pushes to
  Supabase when online. Conflicts resolve last-write-wins on `updated_at`
  (epoch millis).
- **Guest mode**: browse and use the app without an account. Data is local only
  and is adopted into the account on first sign-in.
- **Distraction plan**: Cadence cannot close other apps from the browser; the
  feature is an honest reminder/plan, not a system-level blocker.
