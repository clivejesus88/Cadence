-- =============================================================================
-- Cadence — Supabase schema (run this once in the Supabase SQL editor)
--
-- What this creates:
--   1. tasks / focus_sessions / preferences / profile tables
--   2. An epoch-ms updated_at watermark for last-write-wins sync
--   3. Auto-created profile + preferences rows on signup
--   4. Row-Level Security so every query is scoped to auth.uid()
--
-- All "updated_at" columns use bigint epoch-millis to match what the
-- offline-first Dexie client writes, so LWW comparisons stay numeric.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.tasks (
  id                   text primary key,
  user_id              uuid not null references auth.users (id) on delete cascade,
  title                text not null,
  subject              text not null default '',
  estimated_pomodoros  integer not null default 0,
  completed_pomodoros  integer not null default 0,
  due_date             text not null,
  completed            boolean not null default false,
  created_at           bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at           bigint not null default (extract(epoch from now()) * 1000)::bigint,
  deleted              boolean not null default false
);

create table if not exists public.focus_sessions (
  id               text primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  date             text not null,
  duration_minutes integer not null default 0,
  type             text not null default 'focus',
  completed        boolean not null default true,
  task_id          text,
  created_at       bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at       bigint not null default (extract(epoch from now()) * 1000)::bigint,
  deleted          boolean not null default false
);

create table if not exists public.preferences (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  default_duration   integer not null default 25,
  break_length       integer not null default 5,
  auto_start_breaks  boolean not null default true,
  session_reminders  boolean not null default true,
  daily_summary      boolean not null default false,
  block_during_focus boolean not null default true,
  strict_mode        boolean not null default false,
  updated_at         bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.profile (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  name         text not null default '',
  email        text not null default '',
  school       text not null default '',
  avatar_url   text not null default '',
  plan         text not null default 'free',
  member_since text not null default '',
  updated_at   bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- -----------------------------------------------------------------------------
-- updated_at trigger (keeps the epoch-ms watermark honest on server-side writes)
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = (extract(epoch from now()) * 1000)::bigint;
  return new;
end $$;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_focus_sessions_updated_at on public.focus_sessions;
create trigger set_focus_sessions_updated_at before update on public.focus_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_preferences_updated_at on public.preferences;
create trigger set_preferences_updated_at before update on public.preferences
  for each row execute function public.set_updated_at();

drop trigger if exists set_profile_updated_at on public.profile;
create trigger set_profile_updated_at before update on public.profile
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create profile + preferences rows on signup
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile (user_id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email
  )
  on conflict (user_id) do nothing;

  insert into public.preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row-Level Security — every select/insert/update/delete is scoped to the
-- signed-in user (auth.uid()). The client anon key can never touch another
-- user's rows.
-- -----------------------------------------------------------------------------

alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.preferences enable row level security;
alter table public.profile enable row level security;

create policy "own tasks only"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own sessions only"
  on public.focus_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own preferences only"
  on public.preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own profile only"
  on public.profile for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);