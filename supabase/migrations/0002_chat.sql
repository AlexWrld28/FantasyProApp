create table public.league_chat_messages (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index league_chat_messages_league_created_idx
on public.league_chat_messages (league_id, created_at desc);

create table public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dm_participants (
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  muted_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index dm_participants_user_idx
on public.dm_participants (user_id, conversation_id);

create table public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index dm_messages_conversation_created_idx
on public.dm_messages (conversation_id, created_at desc);

create or replace function public.is_dm_participant(check_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dm_participants
    where conversation_id = check_conversation_id
      and user_id = auth.uid()
  );
$$;

alter table public.league_chat_messages enable row level security;
alter table public.dm_conversations enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;

create policy "members read league chat"
on public.league_chat_messages for select
to authenticated
using (public.is_league_member(league_id) and deleted_at is null);

create policy "members send league chat"
on public.league_chat_messages for insert
to authenticated
with check (public.is_league_member(league_id) and author_id = auth.uid());

create policy "authors edit league chat"
on public.league_chat_messages for update
to authenticated
using (author_id = auth.uid() and deleted_at is null)
with check (author_id = auth.uid());

create policy "participants read dm conversations"
on public.dm_conversations for select
to authenticated
using (public.is_dm_participant(id));

create policy "members create dm conversations"
on public.dm_conversations for insert
to authenticated
with check (public.is_league_member(league_id) and created_by = auth.uid());

create policy "participants read dm participants"
on public.dm_participants for select
to authenticated
using (public.is_dm_participant(conversation_id));

create policy "members join dm conversations"
on public.dm_participants for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.dm_conversations dc
    where dc.id = dm_participants.conversation_id
      and dc.created_by = auth.uid()
      and public.is_league_member(dc.league_id)
  )
);

create policy "participants read dm messages"
on public.dm_messages for select
to authenticated
using (public.is_dm_participant(conversation_id) and deleted_at is null);

create policy "participants send dm messages"
on public.dm_messages for insert
to authenticated
with check (public.is_dm_participant(conversation_id) and author_id = auth.uid());

create policy "authors edit dm messages"
on public.dm_messages for update
to authenticated
using (author_id = auth.uid() and deleted_at is null)
with check (author_id = auth.uid());
