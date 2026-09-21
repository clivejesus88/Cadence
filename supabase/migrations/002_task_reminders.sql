-- Cadence — task reminders preference
-- Run this once in the Supabase SQL editor (or via supabase db push).
alter table public.preferences
  add column if not exists task_reminders boolean not null default true;