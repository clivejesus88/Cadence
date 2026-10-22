-- =============================================================================
-- Cadence — server-side rate limiting for Edge Functions
--
-- A sliding-window counter keyed by an arbitrary string (user id, IP, etc.).
-- Edge Functions call public.check_rate_limit(...) with the service role, which
-- is the only role allowed to touch this table (RLS denies everyone else).
-- =============================================================================

create table if not exists public.rate_limits (
  key          text not null,
  window_start bigint not null,
  count        integer not null default 0,
  locked_until bigint not null default 0,
  primary key (key, window_start)
);

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
-- No policies: only the service role (which bypasses RLS) may read/write.

-- Atomically consume one token. Returns allowed + retry_after_ms so the caller
-- can set a Retry-After header.
create or replace function public.check_rate_limit(
  p_key       text,
  p_max       integer,
  p_window_ms bigint,
  p_lock_ms   bigint
)
returns table (allowed boolean, retry_after_ms bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now    bigint := (extract(epoch from now()) * 1000)::bigint;
  v_start  bigint;
  v_count  integer;
  v_locked bigint;
begin
  v_start := v_now - (v_now % p_window_ms);

  select rl.count, rl.locked_until
    into v_count, v_locked
  from public.rate_limits rl
  where rl.key = p_key and rl.window_start = v_start
  limit 1;

  if v_locked is not null and v_locked > v_now then
    return query select false, v_locked - v_now;
    return;
  end if;

  if v_count is null then
    insert into public.rate_limits (key, window_start, count, locked_until)
    values (p_key, v_start, 1, 0)
    on conflict (key, window_start) do update set count = public.rate_limits.count + 1;
    return query select true, 0::bigint;
    return;
  end if;

  v_count := v_count + 1;

  if v_count > p_max then
    update public.rate_limits
      set count = 0, locked_until = v_now + p_lock_ms
      where key = p_key and window_start = v_start;
    return query select false, p_lock_ms;
    return;
  end if;

  update public.rate_limits
    set count = v_count
    where key = p_key and window_start = v_start;
  return query select true, 0::bigint;
end $$;

-- Housekeeping: drop counters older than a day. Scheduled hourly alongside the
-- reminder dispatcher. Guarded so the migration still applies if pg_cron is not
-- available on this project.
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits
  where window_start < (extract(epoch from now()) * 1000)::bigint - 86400000;
$$;

do $outer$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'cadence-prune-rate-limits') then
      perform cron.schedule('cadence-prune-rate-limits', '15 * * * *', $cmd$ select public.prune_rate_limits(); $cmd$);
    end if;
  end if;
exception when others then
  raise notice 'Skipping rate-limit prune schedule: %', sqlerrm;
end $outer$;
