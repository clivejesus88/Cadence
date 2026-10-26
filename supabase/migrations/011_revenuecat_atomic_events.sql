create or replace function public.process_revenuecat_event(
  p_event_id text,
  p_user_id uuid,
  p_event_type text,
  p_event_timestamp_ms bigint,
  p_plan text,
  p_external_subscription_id text,
  p_expiration_at_ms bigint,
  p_member_since text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_timestamp bigint;
  latest_event_type text;
  inserted_event_id text;
  now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
  is_expiration boolean;
begin
  is_expiration := p_event_type = 'EXPIRATION';

  if p_event_id is null
    or p_event_id = ''
    or p_event_type is null
    or p_event_type = ''
    or p_event_timestamp_ms is null
    or p_event_timestamp_ms <= 0
    or p_plan is null
    or p_plan not in ('monthly', 'yearly')
  then
    raise exception 'Invalid RevenueCat event';
  end if;

  if p_event_type not in (
    'INITIAL_PURCHASE',
    'RENEWAL',
    'UNCANCELLATION',
    'PRODUCT_CHANGE',
    'SUBSCRIPTION_EXTENDED',
    'NON_RENEWING_PURCHASE',
    'REFUND_REVERSED',
    'EXPIRATION'
  ) then
    insert into public.revenuecat_webhook_events (
      event_id, user_id, event_type, event_timestamp_ms
    ) values (
      p_event_id, p_user_id, p_event_type, p_event_timestamp_ms
    )
    on conflict (event_id) do nothing
    returning event_id into inserted_event_id;
    return case when inserted_event_id is null then 'duplicate' else 'ignored' end;
  end if;

  perform 1
  from public.profile
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found for RevenueCat user %', p_user_id;
  end if;

  select event_timestamp_ms, event_type
  into latest_timestamp, latest_event_type
  from public.revenuecat_webhook_events
  where user_id = p_user_id
  order by event_timestamp_ms desc, (event_type = 'EXPIRATION') desc
  limit 1;

  insert into public.revenuecat_webhook_events (
    event_id, user_id, event_type, event_timestamp_ms
  ) values (
    p_event_id, p_user_id, p_event_type, p_event_timestamp_ms
  )
  on conflict (event_id) do nothing
  returning event_id into inserted_event_id;

  if inserted_event_id is null then
    return 'duplicate';
  end if;

  if p_event_timestamp_ms < coalesce(latest_timestamp, 0)
    or (
      p_event_timestamp_ms = latest_timestamp
      and latest_event_type = 'EXPIRATION'
      and not is_expiration
    )
  then
    return 'stale';
  end if;

  update public.profile
  set plan = case when is_expiration then 'free' else 'pro' end,
      member_since = case when is_expiration then '' else p_member_since end
  where user_id = p_user_id;

  insert into public.subscriptions (
    id,
    user_id,
    provider,
    status,
    plan,
    external_subscription_id,
    current_period_end,
    cancelled_at,
    last_event_at,
    updated_at
  ) values (
    'revenuecat-' || p_user_id::text,
    p_user_id,
    'revenuecat',
    case when is_expiration then 'expired' else 'active' end,
    p_plan,
    p_external_subscription_id,
    nullif(p_expiration_at_ms, 0),
    case when is_expiration then now_ms else null end,
    p_event_timestamp_ms,
    now_ms
  )
  on conflict (id) do update
  set status = excluded.status,
      plan = excluded.plan,
      external_subscription_id = excluded.external_subscription_id,
      current_period_end = excluded.current_period_end,
      cancelled_at = excluded.cancelled_at,
      last_event_at = excluded.last_event_at,
      updated_at = excluded.updated_at;

  return 'processed';
end;
$$;

revoke all on function public.process_revenuecat_event(
  text, uuid, text, bigint, text, text, bigint, text
) from public, anon, authenticated;
grant execute on function public.process_revenuecat_event(
  text, uuid, text, bigint, text, text, bigint, text
) to service_role;
