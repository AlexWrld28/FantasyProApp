create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season_year integer not null,
  invite_code text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('commissioner', 'manager', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  manager_id uuid references public.profiles(id) on delete set null,
  name text not null,
  logo_url text,
  record_wins integer not null default 0,
  record_losses integer not null default 0,
  waiver_priority integer not null default 1,
  faab_remaining integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scoring_rules (
  league_id uuid primary key references public.leagues(id) on delete cascade,
  passing_yards_per_point numeric not null default 25,
  passing_touchdown numeric not null default 4,
  interception numeric not null default -2,
  rushing_yards_per_point numeric not null default 10,
  rushing_touchdown numeric not null default 6,
  reception numeric not null default 1,
  receiving_yards_per_point numeric not null default 10,
  receiving_touchdown numeric not null default 6,
  fumble_lost numeric not null default -2,
  two_point_conversion numeric not null default 2,
  field_goal numeric not null default 3,
  extra_point numeric not null default 1,
  sack numeric not null default 1,
  turnover_forced numeric not null default 2,
  defensive_touchdown numeric not null default 6,
  points_allowed_under_7 numeric not null default 7,
  points_allowed_under_14 numeric not null default 4,
  points_allowed_over_34 numeric not null default -4,
  updated_at timestamptz not null default now()
);

create table public.roster_settings (
  league_id uuid primary key references public.leagues(id) on delete cascade,
  qb_slots integer not null default 1,
  rb_slots integer not null default 1,
  wr_slots integer not null default 1,
  te_slots integer not null default 1,
  flex_slots integer not null default 1,
  k_slots integer not null default 1,
  dst_slots integer not null default 1,
  bench_slots integer not null default 6,
  ir_slots integer not null default 2,
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  full_name text not null,
  team text,
  position text,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.team_players (
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  roster_slot text not null,
  acquired_at timestamptz not null default now(),
  primary key (team_id, player_id)
);

create table public.matchups (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season_year integer not null,
  week integer not null,
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  home_points numeric not null default 0,
  away_points numeric not null default 0,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_week_stats (
  player_id uuid not null references public.players(id) on delete cascade,
  season_year integer not null,
  week integer not null,
  source text not null default 'manual',
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (player_id, season_year, week, source)
);

create table public.fantasy_scores (
  matchup_id uuid not null references public.matchups(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  roster_slot text not null,
  points numeric not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (matchup_id, team_id, player_id)
);

create or replace function public.is_league_member(check_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members
    where league_id = check_league_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.teams enable row level security;
alter table public.scoring_rules enable row level security;
alter table public.roster_settings enable row level security;
alter table public.players enable row level security;
alter table public.team_players enable row level security;
alter table public.matchups enable row level security;
alter table public.player_week_stats enable row level security;
alter table public.fantasy_scores enable row level security;

create policy "profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "members read leagues"
on public.leagues for select
to authenticated
using (public.is_league_member(id) or created_by = auth.uid());

create policy "users create leagues"
on public.leagues for insert
to authenticated
with check (created_by = auth.uid());

create policy "members read membership"
on public.league_members for select
to authenticated
using (public.is_league_member(league_id) or user_id = auth.uid());

create policy "commissioners manage membership"
on public.league_members for all
to authenticated
using (
  exists (
    select 1 from public.league_members lm
    where lm.league_id = league_members.league_id
      and lm.user_id = auth.uid()
      and lm.role = 'commissioner'
  )
)
with check (
  exists (
    select 1 from public.league_members lm
    where lm.league_id = league_members.league_id
      and lm.user_id = auth.uid()
      and lm.role = 'commissioner'
  )
);

create policy "members read teams"
on public.teams for select
to authenticated
using (public.is_league_member(league_id));

create policy "team managers update teams"
on public.teams for update
to authenticated
using (manager_id = auth.uid() or public.is_league_member(league_id))
with check (manager_id = auth.uid() or public.is_league_member(league_id));

create policy "members read scoring rules"
on public.scoring_rules for select
to authenticated
using (public.is_league_member(league_id));

create policy "members read roster settings"
on public.roster_settings for select
to authenticated
using (public.is_league_member(league_id));

create policy "authenticated users read players"
on public.players for select
to authenticated
using (true);

create policy "members read rosters"
on public.team_players for select
to authenticated
using (
  exists (
    select 1 from public.teams t
    where t.id = team_players.team_id
      and public.is_league_member(t.league_id)
  )
);

create policy "members read matchups"
on public.matchups for select
to authenticated
using (public.is_league_member(league_id));

create policy "members read fantasy scores"
on public.fantasy_scores for select
to authenticated
using (
  exists (
    select 1 from public.matchups m
    where m.id = fantasy_scores.matchup_id
      and public.is_league_member(m.league_id)
  )
);

create policy "authenticated users read weekly stats"
on public.player_week_stats for select
to authenticated
using (true);
