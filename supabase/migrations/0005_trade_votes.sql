alter table public.trade_proposals
drop constraint if exists trade_proposals_status_check;

alter table public.trade_proposals
add constraint trade_proposals_status_check
check (status in ('draft', 'sent', 'voting', 'approved', 'vetoed', 'accepted', 'declined', 'countered', 'expired'));

create table public.trade_proposal_votes (
  proposal_id uuid not null references public.trade_proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote text not null check (vote in ('approve', 'veto')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

create index trade_proposal_votes_vote_idx
on public.trade_proposal_votes (proposal_id, vote);

alter table public.trade_proposal_votes enable row level security;

create policy "members read trade proposal votes"
on public.trade_proposal_votes for select
to authenticated
using (
  exists (
    select 1
    from public.trade_proposals tp
    where tp.id = trade_proposal_votes.proposal_id
      and public.is_league_member(tp.league_id)
  )
);

create policy "members cast their trade vote"
on public.trade_proposal_votes for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trade_proposals tp
    where tp.id = trade_proposal_votes.proposal_id
      and tp.status in ('sent', 'voting')
      and public.is_league_member(tp.league_id)
  )
);

create policy "members update their trade vote"
on public.trade_proposal_votes for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trade_proposals tp
    where tp.id = trade_proposal_votes.proposal_id
      and tp.status in ('sent', 'voting')
      and public.is_league_member(tp.league_id)
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trade_proposals tp
    where tp.id = trade_proposal_votes.proposal_id
      and tp.status in ('sent', 'voting')
      and public.is_league_member(tp.league_id)
  )
);

create or replace view public.trade_proposal_vote_results
with (security_invoker = true) as
select
  tp.id as proposal_id,
  tp.league_id,
  count(tpv.*) filter (where tpv.vote = 'approve') as approve_votes,
  count(tpv.*) filter (where tpv.vote = 'veto') as veto_votes,
  case
    when count(tpv.*) filter (where tpv.vote = 'approve') > count(tpv.*) filter (where tpv.vote = 'veto') then 'approved'
    when count(tpv.*) filter (where tpv.vote = 'veto') > count(tpv.*) filter (where tpv.vote = 'approve') then 'vetoed'
    else 'tied'
  end as current_result
from public.trade_proposals tp
left join public.trade_proposal_votes tpv on tpv.proposal_id = tp.id
group by tp.id, tp.league_id;
