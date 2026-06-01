create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index direct_messages_pair_created_idx
on public.direct_messages (
  least(sender_id, recipient_id),
  greatest(sender_id, recipient_id),
  created_at
);

alter table public.direct_messages enable row level security;

create policy "users read their direct messages"
on public.direct_messages for select
to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "users send direct messages"
on public.direct_messages for insert
to authenticated
with check (sender_id = auth.uid());
