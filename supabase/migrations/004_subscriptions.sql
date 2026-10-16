-- Cadence — migration 004: PayPal subscriptions
-- Adds subscriptions table to track PayPal recurring subscriptions
-- and related access state.

create table if not exists public.subscriptions (
  id                      text primary key,
  user_id                 uuid not null references auth.users (id) on delete cascade,
  provider                text not null default 'paypal',
  status                  text not null default 'pending',
  plan                    text not null default 'monthly',
  paypal_subscription_id  text,
  current_period_end      bigint,
  cancelled_at            bigint,
  created_at              bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at              bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_paypal_sub_id on public.subscriptions(paypal_subscription_id);

-- Keep updated_at in sync
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- RLS
alter table public.subscriptions enable row level security;

create policy "own subscriptions only"
  on public.subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: ensure user has at most one active subscription record? not enforced here
