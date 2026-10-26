alter table public.subscriptions
  add column if not exists external_subscription_id text,
  add column if not exists last_event_at bigint;

create table if not exists public.revenuecat_webhook_events (
  event_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  event_timestamp_ms bigint not null,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists idx_revenuecat_webhook_events_user_time
  on public.revenuecat_webhook_events(user_id, event_timestamp_ms desc);

alter table public.revenuecat_webhook_events enable row level security;
