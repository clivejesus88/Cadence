create table if not exists public.leaderboard_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  alias text not null,
  opted_in boolean not null default false,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  constraint leaderboard_alias_format check (
    alias ~ '^[A-Za-z0-9][A-Za-z0-9 ._-]{1,23}$'
  )
);

create unique index if not exists leaderboard_profiles_alias_unique
  on public.leaderboard_profiles (lower(alias))
  where opted_in;

create or replace function public.set_leaderboard_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = (extract(epoch from now()) * 1000)::bigint;
  return new;
end $$;

drop trigger if exists set_leaderboard_profile_updated_at on public.leaderboard_profiles;
create trigger set_leaderboard_profile_updated_at
  before update on public.leaderboard_profiles
  for each row execute function public.set_leaderboard_profile_updated_at();

alter table public.leaderboard_profiles enable row level security;

drop policy if exists "own leaderboard profile only" on public.leaderboard_profiles;
create policy "own leaderboard profile only"
  on public.leaderboard_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.leaderboard_profiles to authenticated;

drop function if exists public.get_weekly_leaderboard();

create function public.get_weekly_leaderboard()
returns table (
  rank_position bigint,
  display_alias text,
  focus_minutes integer,
  is_current_user boolean,
  avatar_url text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with week_bounds as (
    select
      date_trunc('week', now() at time zone 'UTC')::date as week_start,
      (date_trunc('week', now() at time zone 'UTC')::date + 7) as week_end
  ),
  daily_totals as (
    select
      fs.user_id,
      fs.date::date as day,
      least(120, sum(greatest(fs.duration_minutes, 0)))::integer as minutes
    from public.focus_sessions fs
    cross join week_bounds wb
    where fs.deleted = false
      and fs.type = 'focus'
      and fs.completed = true
      and fs.date::date >= wb.week_start
      and fs.date::date < wb.week_end
    group by fs.user_id, fs.date::date
  ),
  weekly_totals as (
    select
      lp.user_id,
      lp.alias,
      coalesce(sum(dt.minutes), 0)::integer as minutes,
      p.avatar_url
    from public.leaderboard_profiles lp
    left join daily_totals dt on dt.user_id = lp.user_id
    left join public.profile p on p.user_id = lp.user_id
    where lp.opted_in = true
    group by lp.user_id, lp.alias, p.avatar_url
  ),
  ranked as (
    select
      row_number() over (order by wt.minutes desc, lower(wt.alias), wt.user_id) as position,
      wt.user_id,
      wt.alias,
      wt.minutes,
      wt.avatar_url
    from weekly_totals wt
  )
  select
    ranked.position,
    ranked.alias,
    ranked.minutes,
    ranked.user_id = auth.uid(),
    coalesce(ranked.avatar_url, '') as avatar_url
  from ranked
  where ranked.position <= 50
     or ranked.user_id = auth.uid()
  order by ranked.position
$$;

revoke all on function public.get_weekly_leaderboard() from public, anon;
grant execute on function public.get_weekly_leaderboard() to authenticated;
