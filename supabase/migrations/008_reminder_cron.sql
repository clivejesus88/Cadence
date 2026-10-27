-- =============================================================================
-- Cadence — schedule the hourly reminder dispatcher
--
-- Requires the pg_cron and pg_net extensions (enable in Dashboard → Database →
-- Extensions, or the `create extension` statements below if your role allows).
--
-- IMPORTANT: the migration does not create the schedule automatically.
-- Store the project URL and the same CRON_SECRET configured on the Edge
-- Function in Supabase Vault, then run the scheduling query below.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

-- Run once in the SQL editor, replacing both placeholders. Keep the secret in
-- Vault rather than embedding it in the scheduled command:
--
--   select vault.create_secret(
--     'https://<PROJECT_REF>.supabase.co',
--     'cadence_project_url'
--   );
--   select vault.create_secret('<CRON_SECRET>', 'cadence_cron_secret');
--
--   select cron.schedule(
--     'cadence-dispatch-reminders',
--     '0 * * * *',
--     $$
--     select net.http_post(
--       url     := (select decrypted_secret
--                   from vault.decrypted_secrets
--                   where name = 'cadence_project_url')
--                   || '/functions/v1/dispatch-reminders',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', (select decrypted_secret
--                           from vault.decrypted_secrets
--                           where name = 'cadence_cron_secret')
--       ),
--       body    := '{}'::jsonb
--     );
--     $$
--   );
--
-- To remove:  select cron.unschedule('cadence-dispatch-reminders');
