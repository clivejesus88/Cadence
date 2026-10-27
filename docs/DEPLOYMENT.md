# Deployment checklist

Everything needed to take Cadence live on Vercel + Supabase.

## 1. Supabase project

1. Create (or open) the project. Note the **project ref**, **URL**, **anon key**,
   and **service role key**.
2. Apply migrations in order — Dashboard → SQL editor, or `supabase db push`:

   ```
   0001_init.sql
   002_task_reminders.sql
   003_blocking_rules.sql
   004_subscriptions.sql
   005_payment_security.sql
   006_daily_goal.sql
   007_push.sql          -- push_subscriptions + reminder_log + profile.timezone
   008_reminder_cron.sql -- enable pg_cron/pg_net, then schedule (see file)
   009_rate_limits.sql   -- rate_limits table + check_rate_limit() RPC
   010_revenuecat.sql    -- RevenueCat subscription metadata and webhook tracking
   011_revenuecat_atomic_events.sql -- atomically deduplicates/orders webhook updates
   ```

3. Enable extensions `pg_cron`, `pg_net`, and `supabase_vault` (Dashboard →
   Database → Extensions).
4. Confirm `profile.plan` / `member_since` are protected (from `005`) and that
   `subscriptions` is read-only for clients.
5. Schedule the reminder dispatcher as described in
   `supabase/migrations/008_reminder_cron.sql`. Applying that migration enables
   the extensions but does not create the scheduled job. The schedule must call
   `dispatch-reminders` hourly with the same `CRON_SECRET` configured below.
   Store the project URL and cron secret in Vault; the migration includes the
   SQL to create the job.

## 2. VAPID keys

```bash
npx web-push generate-vapid-keys
```

- Public → browser `VITE_VAPID_PUBLIC_KEY` **and** edge `VAPID_PUBLIC_KEY`
- Private → edge `VAPID_PRIVATE_KEY` (never in the browser)
- Set `VAPID_SUBJECT=mailto:support@cadence.app`

## 3. RevenueCat Web Billing

1. Create a RevenueCat Web Billing app and connect your Stripe account.
2. Create monthly and annual products. In the current offering, add packages
   with the exact custom identifiers `rc_monthly` and `rc_annual`, and attach
   the matching products.
3. Create the `pro` entitlement and attach both products to it.
4. Copy the Web Billing public API key to Vercel as
   `VITE_REVENUECAT_WEB_API_KEY`.
5. Deploy the webhook function, then configure a RevenueCat webhook targeting:

   `https://<ref>.supabase.co/functions/v1/revenuecat-webhook`

The dashboard paywall uses packages from the current offering. Verify that this
offering is marked **Current**, contains packages with the exact identifiers
above, and each package's product is attached to the `pro` entitlement. Also
confirm the web API key belongs to this RevenueCat project and the app has been
redeployed after changing the Vercel environment variable.

### Design the RevenueCat Paywall

The app opens RevenueCat's dashboard-designed paywall from the current
offering. In RevenueCat, create and publish a Paywall for web, attach it to
that offering, and add selectable package components for `rc_monthly` and
`rc_annual` with a purchase button. Use RevenueCat's localized price variables
and clearly state each billing period and auto-renewal/cancellation terms.
Include working Terms and Privacy links. Preview the web paywall and verify
both products are selectable before testing checkout.

## 4. Edge Function secrets

```bash
supabase secrets set \
  SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  SENTRY_DSN=... \
  REVENUECAT_WEBHOOK_AUTHORIZATION="Bearer <random-secret>" \
  REVENUECAT_PRO_ENTITLEMENT_ID=pro \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:support@cadence.app \
  CRON_SECRET=$(openssl rand -hex 32)
```

Deploy:

```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy send-push
supabase functions deploy dispatch-reminders
```

RevenueCat authenticates with the configured Authorization header, not a
Supabase JWT, so the webhook function must be deployed with JWT verification
disabled. The function validates the shared secret itself. Set the RevenueCat
webhook Authorization header to the exact same value as
`REVENUECAT_WEBHOOK_AUTHORIZATION`.

Schedule the dispatcher with the same `CRON_SECRET` (see `008_reminder_cron.sql`).

## 5. Vercel

1. Import the repo; framework preset **Vite**.
2. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_VAPID_PUBLIC_KEY`, `VITE_SENTRY_DSN`,
   `VITE_REVENUECAT_WEB_API_KEY`.
3. Deploy. SPA rewrites are in `vercel.json`.

## 6. Post-deploy verification

- [ ] Install PWA on Android (Chrome) and iOS 16.4+ (Safari → Add to Home Screen)
- [ ] Reminder toggle → permission prompt → subscription row appears
- [ ] Run `dispatch-reminders` with the correct `x-cron-secret`; verify due-task/session pushes at 16:00 local and evening summary at 18:00 local
- [ ] Purchase monthly through RevenueCat sandbox → becomes Pro (webhook updates `profile.plan`)
- [ ] Verify an expired RevenueCat subscription reverts to free
- [ ] Sign in on a second device → data syncs
- [ ] Airplane mode → app shell still loads (offline)
- [ ] `dispatch-reminders` runs (check `cron.job_run_details` and `reminder_log`)
