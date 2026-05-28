create table public.trade_proposals (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  proposing_team_id uuid not null references public.teams(id) on delete cascade,
  receiving_team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'countered', 'expired')),
  decision_mode text not null default 'balanced' check (decision_mode in ('win-now', 'balanced', 'keeper')),
  risk_tolerance integer not null default 50 check (risk_tolerance between 0 and 100),
  keeper_weight integer not null default 50 check (keeper_weight between 0 and 100),
  need_weight integer not null default 50 check (need_weight between 0 and 100),
  ai_fairness_score integer check (ai_fairness_score between 0 and 100),
  ai_net_edge numeric,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trade_proposals_league_created_idx
on public.trade_proposals (league_id, created_at desc);

create table public.trade_proposal_assets (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.trade_proposals(id) on delete cascade,
  side text not null check (side in ('proposing', 'receiving')),
  asset_type text not null check (asset_type in ('player', 'pick', 'faab', 'other')),
  player_id uuid references public.players(id) on delete set null,
  label text not null,
  value numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index trade_proposal_assets_proposal_idx
on public.trade_proposal_assets (proposal_id, side);

alter table public.trade_proposals enable row level security;
alter table public.trade_proposal_assets enable row level security;

create policy "members read trade proposals"
on public.trade_proposals for select
to authenticated
using (public.is_league_member(league_id));

create policy "members create trade proposals"
on public.trade_proposals for insert
to authenticated
with check (public.is_league_member(league_id) and created_by = auth.uid());

create policy "proposal creators update trade proposals"
on public.trade_proposals for update
to authenticated
using (created_by = auth.uid() and public.is_league_member(league_id))
with check (created_by = auth.uid() and public.is_league_member(league_id));

create policy "members read trade proposal assets"
on public.trade_proposal_assets for select
to authenticated
using (
  exists (
    select 1
    from public.trade_proposals tp
    where tp.id = trade_proposal_assets.proposal_id
      and public.is_league_member(tp.league_id)
  )
);

create policy "proposal creators manage trade proposal assets"
on public.trade_proposal_assets for all
to authenticated
using (
  exists (
    select 1
    from public.trade_proposals tp
    where tp.id = trade_proposal_assets.proposal_id
      and tp.created_by = auth.uid()
      and public.is_league_member(tp.league_id)
  )
)
with check (
  exists (
    select 1
    from public.trade_proposals tp
    where tp.id = trade_proposal_assets.proposal_id
      and tp.created_by = auth.uid()
      and public.is_league_member(tp.league_id)
  )
);
