-- =============================================================================
-- Cadence — schedule the hourly reminder dispatcher
--
-- Requires the pg_cron and pg_net extensions (enable in Dashboard → Database →
-- Extensions, or the `create extension` statements below if your role allows).
--
-- IMPORTANT: replace <PROJECT_REF> and <CRON_SECRET> before running, or set the
-- values and use the `alter database ... set` approach. The CRON_SECRET here
-- must match the Edge Function secret of the same name.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Vault-backed secrets are preferable; this example keeps it explicit.
-- Run once, substituting real values:
--
--   select cron.schedule(
--     'cadence-dispatch-reminders',
--     '0 * * * *',
--     $$
--     select net.http_post(
--       url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/dispatch-reminders',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', '<CRON_SECRET>'
--       ),
--       body    := '{}'::jsonb
--     );
--     $$
--   );
--
-- To remove:  select cron.unschedule('cadence-dispatch-reminders');
