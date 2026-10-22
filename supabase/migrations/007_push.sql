-- =============================================================================
-- Cadence — Web Push subscriptions + user timezone
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Adds:
--   1. public.push_subscriptions — one row per browser/device push endpoint
--   2. public.profile.timezone  — IANA tz (e.g. "Europe/London") for reminders
--
-- The service role (Edge Functions) reads across users to dispatch reminders;
-- clients may only manage their own subscriptions.
-- =============================================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text not null default '',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

drop policy if exists "own push subscriptions only" on public.push_subscriptions;
create policy "own push subscriptions only"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profile timezone for computing local reminder times server-side.
alter table public.profile
  add column if not exists timezone text not null default '';

-- Dedupe log so an hourly cron never sends the same reminder twice in a day.
create table if not exists public.reminder_log (
  user_id   uuid not null references auth.users (id) on delete cascade,
  kind      text not null,
  local_date text not null,
  sent_at   bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (user_id, kind, local_date)
);

alter table public.reminder_log enable row level security;

drop policy if exists "own reminder log only" on public.reminder_log;
create policy "own reminder log only"
  on public.reminder_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
