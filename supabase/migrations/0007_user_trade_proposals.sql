create table public.user_trade_proposals (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'voting', 'approved', 'vetoed')),
  outgoing_assets jsonb not null default '[]'::jsonb,
  incoming_assets jsonb not null default '[]'::jsonb,
  ai_fairness_score integer check (ai_fairness_score between 0 and 100),
  ai_net_edge numeric,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_trade_proposals_sender_created_idx
on public.user_trade_proposals (sender_id, created_at desc);

create index user_trade_proposals_recipient_created_idx
on public.user_trade_proposals (recipient_id, created_at desc);

alter table public.user_trade_proposals enable row level security;

create policy "users read their trade proposals"
on public.user_trade_proposals for select
to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "users send trade proposals"
on public.user_trade_proposals for insert
to authenticated
with check (sender_id = auth.uid() and recipient_id <> auth.uid());

create policy "recipients decide trade proposals"
on public.user_trade_proposals for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());
