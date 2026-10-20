-- Cadence — daily focus goal preference
-- Run this once in the Supabase SQL editor (or via supabase db push).
alter table public.preferences
  add column if not exists daily_goal_minutes integer not null default 60;
