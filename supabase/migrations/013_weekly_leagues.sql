create table if not exists public.weekly_league_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier integer not null default 1 check (tier between 1 and 5),
  week_start date not null,
  promoted boolean not null default false
);

alter table public.weekly_league_state enable row level security;

drop policy if exists "own weekly league state only" on public.weekly_league_state;
create policy "own weekly league state only"
  on public.weekly_league_state for select
  using (auth.uid() = user_id);

grant select on public.weekly_league_state to authenticated;

drop function if exists public.get_weekly_leaderboard();

create function public.get_weekly_leaderboard()
returns table (
  rank_position bigint,
  display_alias text,
  focus_minutes integer,
  is_current_user boolean,
  avatar_url text,
  league_tier integer,
  league_rank bigint,
  league_size bigint,
  promoted boolean,
  week_start date
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_week_start date;
begin
  current_week_start := date_trunc('week', now() at time zone 'UTC')::date;
  perform pg_advisory_xact_lock(hashtext('cadence-weekly-leagues'));

  insert into public.weekly_league_state (user_id, tier, week_start, promoted)
  select lp.user_id, 1, current_week_start, false
  from public.leaderboard_profiles lp
  where lp.opted_in = true
  on conflict (user_id) do nothing;

  with previous_daily_totals as (
    select
      fs.user_id,
      fs.date::date as day,
      least(120, sum(greatest(fs.duration_minutes, 0)))::integer as minutes
    from public.focus_sessions fs
    where fs.deleted = false
      and fs.type = 'focus'
      and fs.completed = true
      and fs.date::date >= current_week_start - 7
      and fs.date::date < current_week_start
    group by fs.user_id, fs.date::date
  ),
  previous_week_totals as (
    select user_id, sum(minutes)::integer as minutes
    from previous_daily_totals
    group by user_id
  ),
  previous_league_positions as (
    select
      state.user_id,
      state.tier,
      row_number() over (
        partition by state.tier
        order by coalesce(totals.minutes, 0) desc, lower(lp.alias), state.user_id
      ) as league_rank,
      count(*) over (partition by state.tier) as league_size
    from public.weekly_league_state state
    join public.leaderboard_profiles lp on lp.user_id = state.user_id
    left join previous_week_totals totals on totals.user_id = state.user_id
    where state.week_start < current_week_start
      and lp.opted_in = true
  )
  update public.weekly_league_state state
  set
    tier = case
      when positions.league_size < 3 and positions.tier < 5
        then positions.tier + 1
      when positions.league_size >= 5
        and positions.league_rank <= ceil(positions.league_size::numeric * 0.2)
        then least(5, positions.tier + 1)
      when positions.league_size >= 5
        and positions.league_rank > positions.league_size - ceil(positions.league_size::numeric * 0.2)
        then greatest(1, positions.tier - 1)
      else positions.tier
    end,
    week_start = current_week_start,
    promoted = positions.tier < 5
      and (
        positions.league_size < 3
        or (
          positions.league_size >= 5
          and positions.league_rank <= ceil(positions.league_size::numeric * 0.2)
        )
      )
  from previous_league_positions positions
  where state.user_id = positions.user_id;

  return query
  with daily_totals as (
    select
      fs.user_id,
      fs.date::date as day,
      least(120, sum(greatest(fs.duration_minutes, 0)))::integer as minutes
    from public.focus_sessions fs
    where fs.deleted = false
      and fs.type = 'focus'
      and fs.completed = true
      and fs.date::date >= current_week_start
      and fs.date::date < current_week_start + 7
    group by fs.user_id, fs.date::date
  ),
  weekly_totals as (
    select
      lp.user_id,
      lp.alias,
      coalesce(sum(dt.minutes), 0)::integer as minutes,
      p.avatar_url,
      state.tier,
      state.promoted
    from public.leaderboard_profiles lp
    join public.weekly_league_state state on state.user_id = lp.user_id
    left join daily_totals dt on dt.user_id = lp.user_id
    left join public.profile p on p.user_id = lp.user_id
    where lp.opted_in = true
    group by lp.user_id, lp.alias, p.avatar_url, state.tier, state.promoted
  ),
  ranked as (
    select
      row_number() over (order by wt.minutes desc, lower(wt.alias), wt.user_id) as position,
      row_number() over (partition by wt.tier order by wt.minutes desc, lower(wt.alias), wt.user_id) as division_position,
      count(*) over (partition by wt.tier) as division_size,
      wt.user_id,
      wt.alias,
      wt.minutes,
      wt.avatar_url,
      wt.tier,
      wt.promoted
    from weekly_totals wt
  )
  select
    ranked.position,
    ranked.alias,
    ranked.minutes,
    ranked.user_id = auth.uid(),
    coalesce(ranked.avatar_url, ''),
    ranked.tier,
    ranked.division_position,
    ranked.division_size,
    ranked.promoted,
    current_week_start
  from ranked
  where ranked.position <= 50
     or ranked.user_id = auth.uid()
  order by ranked.position;
end
$$;

revoke all on function public.get_weekly_leaderboard() from public, anon;
grant execute on function public.get_weekly_leaderboard() to authenticated;
