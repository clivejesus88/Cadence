-- =============================================================================
-- Cadence — migration 003: advanced blocking rules
--
-- Adds a jsonb column to preferences holding the user's blocking rules
-- (schedule / per-app / per-website). The offline-first client writes this as
-- part of its preferences payload, so no new table is needed.
-- =============================================================================

alter table public.preferences
  add column if not exists blocking_rules jsonb not null default '[]'::jsonb;