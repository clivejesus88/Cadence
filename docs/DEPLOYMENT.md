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
   ```

3. Enable extensions `pg_cron` and `pg_net` (Dashboard → Database → Extensions).
4. Confirm `profile.plan` / `member_since` are protected (from `005`) and that
   `subscriptions` is read-only for clients.

## 2. VAPID keys

```bash
npx web-push generate-vapid-keys
```

- Public → browser `VITE_VAPID_PUBLIC_KEY` **and** edge `VAPID_PUBLIC_KEY`
- Private → edge `VAPID_PRIVATE_KEY` (never in the browser)
- Set `VAPID_SUBJECT=mailto:support@cadence.app`

## 3. PayPal (live)

1. Create a **live** REST app; copy client id + secret.
2. Create the product + monthly/yearly plans:

   ```bash
   PAYPAL_MODE=live PAYPAL_CLIENT_ID=... PAYPAL_SECRET=... \
     node scripts/paypal-setup.mjs
   ```

3. Deploy the functions first, then register the webhook:

   ```bash
   PAYPAL_MODE=live PAYPAL_CLIENT_ID=... PAYPAL_SECRET=... \
     PAYPAL_WEBHOOK_URL=https://<ref>.supabase.co/functions/v1/paypal-webhook \
     node scripts/paypal-webhook-setup.mjs
   ```

   Copy the returned webhook id → `PAYPAL_WEBHOOK_ID`.

## 4. Edge Function secrets

```bash
supabase secrets set \
  SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  SENTRY_DSN=... \
  PAYPAL_MODE=live \
  PAYPAL_CLIENT_ID=... \
  PAYPAL_SECRET=... \
  PAYPAL_PLAN_ID_MONTHLY=... \
  PAYPAL_PLAN_ID_YEARLY=... \
  PAYPAL_WEBHOOK_ID=... \
  ALLOWED_REDIRECT_ORIGINS=https://<app>.vercel.app \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:support@cadence.app \
  CRON_SECRET=$(openssl rand -hex 32)
```

Deploy:

```bash
supabase functions deploy paypal-create-subscription
supabase functions deploy paypal-webhook
supabase functions deploy send-push
supabase functions deploy dispatch-reminders
```

Schedule the dispatcher with the same `CRON_SECRET` (see `008_reminder_cron.sql`).

## 5. Vercel

1. Import the repo; framework preset **Vite**.
2. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_VAPID_PUBLIC_KEY`, `VITE_SENTRY_DSN`.
3. Deploy. SPA rewrites are in `vercel.json`.
4. After the first deploy, confirm `ALLOWED_REDIRECT_ORIGINS` matches the exact
   production origin (no trailing slash).

## 6. Post-deploy verification

- [ ] Install PWA on Android (Chrome) and iOS 16.4+ (Safari → Add to Home Screen)
- [ ] Reminder toggle → permission prompt → subscription row appears
- [ ] Purchase monthly on PayPal → returns → becomes Pro (webhook flips `profile.plan`)
- [ ] Cancel in PayPal → reverts to free
- [ ] Sign in on a second device → data syncs
- [ ] Airplane mode → app shell still loads (offline)
- [ ] `dispatch-reminders` runs (check `cron.job_run_details` and `reminder_log`)
