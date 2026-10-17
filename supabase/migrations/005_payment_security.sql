-- =============================================================================
-- Cadence — migration 005: payment security hardening
--
-- 1. Blocks authenticated clients from changing profile.plan / member_since
--    (only service-role, i.e. the payment webhook, may change billing state)
-- 2. Subscriptions table becomes read-only for clients; only edge functions
--    (service role, bypasses RLS) may write it
-- =============================================================================

-- 1) Protect billing columns on profile
create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(current_setting('request.jwt.claims', true)::json->>'role', '');
  if jwt_role in ('authenticated', 'anon') then
    new.plan := old.plan;
    new.member_since := old.member_since;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_billing on public.profile;
create trigger protect_profile_billing before update on public.profile
  for each row execute function public.protect_profile_billing_columns();

-- 2) Subscriptions: clients may only read their own rows
drop policy if exists "own subscriptions only" on public.subscriptions;
create policy "own subscriptions read only"
  on public.subscriptions for select
  using (auth.uid() = user_id);
