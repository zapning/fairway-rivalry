-- =====================================================================
-- FAIRWAY GOLF LEAGUE — Backend Schema v1
-- =====================================================================
-- Run this in Supabase SQL Editor once.
-- Covers all 5 social blockers: friendships, leagues, live rounds,
-- rivalry/challenge proposals, push notifications.
-- =====================================================================

-- ---------- 1. FRIENDSHIPS ----------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id_a uuid not null references auth.users(id) on delete cascade,
  user_id_b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  accepted_at timestamptz,
  check (user_id_a < user_id_b), -- normalize ordering
  unique (user_id_a, user_id_b)
);

create index if not exists friendships_a_idx on public.friendships(user_id_a);
create index if not exists friendships_b_idx on public.friendships(user_id_b);

alter table public.friendships enable row level security;

create policy "Members see own friendships" on public.friendships
  for select using (auth.uid() = user_id_a or auth.uid() = user_id_b);

create policy "Users create friendships involving themselves" on public.friendships
  for insert with check (auth.uid() = created_by and (auth.uid() = user_id_a or auth.uid() = user_id_b));

create policy "Either party can update status" on public.friendships
  for update using (auth.uid() = user_id_a or auth.uid() = user_id_b);

create policy "Either party can delete" on public.friendships
  for delete using (auth.uid() = user_id_a or auth.uid() = user_id_b);

-- ---------- 2. FRIEND INVITES ----------
create table if not exists public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  invited_at timestamptz default now(),
  accepted_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days')
);

create index if not exists fi_inviter_idx on public.friend_invites(inviter_id);
create index if not exists fi_email_idx on public.friend_invites(lower(email));

alter table public.friend_invites enable row level security;

create policy "Inviter sees own invites" on public.friend_invites
  for select using (auth.uid() = inviter_id);

create policy "Invited user sees invites to their email" on public.friend_invites
  for select using (
    exists (select 1 from auth.users u where u.id = auth.uid() and lower(u.email) = lower(friend_invites.email))
  );

create policy "Users create invites from themselves" on public.friend_invites
  for insert with check (auth.uid() = inviter_id);

create policy "Invited user can accept" on public.friend_invites
  for update using (
    exists (select 1 from auth.users u where u.id = auth.uid() and lower(u.email) = lower(friend_invites.email))
  );

-- ---------- 3. LEAGUES ----------
create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  year int not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  period_start date,
  period_end date,
  closed_at timestamptz
);

create index if not exists leagues_owner_idx on public.leagues(owner_id);
create index if not exists leagues_code_idx on public.leagues(code);

alter table public.leagues enable row level security;

-- Anyone can look up by code (needed for join flow)
create policy "Public read of league name+code" on public.leagues
  for select using (true);

create policy "Authenticated users create leagues they own" on public.leagues
  for insert with check (auth.uid() = owner_id);

create policy "Owner updates league" on public.leagues
  for update using (auth.uid() = owner_id);

create policy "Owner deletes league" on public.leagues
  for delete using (auth.uid() = owner_id);

-- ---------- 4. LEAGUE MEMBERS ----------
create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  friend_id text, -- for local friends not yet on cloud
  name text not null,
  role text not null default 'member' check (role in ('owner','member')),
  status text not null default 'active' check (status in ('active','pending','removed')),
  joined_at timestamptz default now(),
  unique (league_id, user_id)
);

create index if not exists lm_league_idx on public.league_members(league_id);
create index if not exists lm_user_idx on public.league_members(user_id);

alter table public.league_members enable row level security;

create policy "Members see league rosters they're in" on public.league_members
  for select using (
    exists (select 1 from public.league_members lm2 where lm2.league_id = league_members.league_id and lm2.user_id = auth.uid())
  );

create policy "Join league as self" on public.league_members
  for insert with check (auth.uid() = user_id);

create policy "Owner adds pending members" on public.league_members
  for insert with check (
    exists (select 1 from public.leagues l where l.id = league_members.league_id and l.owner_id = auth.uid())
  );

create policy "Owner updates members" on public.league_members
  for update using (
    exists (select 1 from public.leagues l where l.id = league_members.league_id and l.owner_id = auth.uid())
  );

create policy "Owner or self removes membership" on public.league_members
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.leagues l where l.id = league_members.league_id and l.owner_id = auth.uid())
  );

-- ---------- 5. LIVE ROUNDS ----------
create table if not exists public.live_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text,
  course_name text,
  status text not null default 'playing' check (status in ('playing','completed','abandoned')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  total int,
  par int,
  differential numeric,
  friends jsonb, -- array of friend ids/names
  notes text
);

create index if not exists lr_user_idx on public.live_rounds(user_id);
create index if not exists lr_status_idx on public.live_rounds(status);
create index if not exists lr_started_idx on public.live_rounds(started_at desc);

alter table public.live_rounds enable row level security;

-- Users see their own + their friends' live rounds
create policy "See own live rounds" on public.live_rounds
  for select using (auth.uid() = user_id);

create policy "See friends' live rounds" on public.live_rounds
  for select using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and ((f.user_id_a = auth.uid() and f.user_id_b = live_rounds.user_id)
        or (f.user_id_b = auth.uid() and f.user_id_a = live_rounds.user_id))
    )
  );

create policy "Create own live rounds" on public.live_rounds
  for insert with check (auth.uid() = user_id);

create policy "Update own live rounds" on public.live_rounds
  for update using (auth.uid() = user_id);

create policy "Delete own live rounds" on public.live_rounds
  for delete using (auth.uid() = user_id);

-- ---------- 6. RIVALRY PROPOSALS (manual standings) ----------
create table if not exists public.rivalry_proposals (
  id uuid primary key default gen_random_uuid(),
  rivalry_key text not null, -- format: "user_a:user_b" sorted
  proposer_id uuid not null references auth.users(id) on delete cascade,
  proposer_score int not null check (proposer_score >= 0),
  opponent_id uuid not null references auth.users(id) on delete cascade,
  opponent_score int not null check (opponent_score >= 0),
  proposed_at timestamptz default now(),
  resolved_at timestamptz,
  resolution text check (resolution in ('accepted','rejected','pending')) default 'pending'
);

create index if not exists rp_key_idx on public.rivalry_proposals(rivalry_key);
create index if not exists rp_opponent_idx on public.rivalry_proposals(opponent_id);

alter table public.rivalry_proposals enable row level security;

create policy "Proposer or opponent see proposal" on public.rivalry_proposals
  for select using (auth.uid() = proposer_id or auth.uid() = opponent_id);

create policy "Proposer creates proposal" on public.rivalry_proposals
  for insert with check (auth.uid() = proposer_id);

create policy "Opponent updates resolution" on public.rivalry_proposals
  for update using (auth.uid() = opponent_id or auth.uid() = proposer_id);

-- ---------- 7. CHALLENGE PROPOSALS ----------
create table if not exists public.challenge_proposals (
  id uuid primary key default gen_random_uuid(),
  rivalry_key text not null,
  challenge_id text not null,
  challenge_name text,
  proposer_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  proposed_winner text not null check (proposed_winner in ('me','them','tie')),
  prize_points int default 1,
  proposed_at timestamptz default now(),
  resolved_at timestamptz,
  resolution text check (resolution in ('accepted','rejected','pending')) default 'pending'
);

create index if not exists cp_key_idx on public.challenge_proposals(rivalry_key);
create index if not exists cp_opponent_idx on public.challenge_proposals(opponent_id);

alter table public.challenge_proposals enable row level security;

create policy "Parties see proposal" on public.challenge_proposals
  for select using (auth.uid() = proposer_id or auth.uid() = opponent_id);

create policy "Proposer creates" on public.challenge_proposals
  for insert with check (auth.uid() = proposer_id);

create policy "Either party updates" on public.challenge_proposals
  for update using (auth.uid() = opponent_id or auth.uid() = proposer_id);

-- ---------- 8. PUSH NOTIFICATION SUBSCRIPTIONS ----------
create table if not exists public.notification_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  device_label text,
  created_at timestamptz default now(),
  unique (endpoint)
);

create index if not exists ns_user_idx on public.notification_subs(user_id);

alter table public.notification_subs enable row level security;

create policy "Users manage own subscriptions" on public.notification_subs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 9. NOTIFICATIONS LOG ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  payload jsonb,
  sent_at timestamptz default now(),
  read_at timestamptz
);

create index if not exists n_user_idx on public.notifications(user_id);
create index if not exists n_sent_idx on public.notifications(sent_at desc);

alter table public.notifications enable row level security;

create policy "Users see own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can mark own as read" on public.notifications
  for update using (auth.uid() = user_id);

-- =====================================================================
-- ENABLE REALTIME on the tables that need cross-device sync
-- =====================================================================
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.league_members;
alter publication supabase_realtime add table public.live_rounds;
alter publication supabase_realtime add table public.rivalry_proposals;
alter publication supabase_realtime add table public.challenge_proposals;
alter publication supabase_realtime add table public.notifications;

-- =====================================================================
-- HELPER FUNCTION: join league by code
-- =====================================================================
create or replace function public.join_league_by_code(code_in text)
returns public.leagues
language plpgsql
security definer
as $$
declare
  lg public.leagues;
  me uuid := auth.uid();
  me_name text;
begin
  if me is null then
    raise exception 'Must be authenticated';
  end if;

  select name into me_name from public.profiles where id = me;
  if me_name is null then
    me_name := (select coalesce(raw_user_meta_data->>'name', email) from auth.users where id = me);
  end if;

  select * into lg from public.leagues where code = upper(code_in) limit 1;
  if lg is null then
    raise exception 'League not found';
  end if;

  insert into public.league_members(league_id, user_id, name, role, status)
  values (lg.id, me, coalesce(me_name, 'Player'), 'member', 'active')
  on conflict (league_id, user_id) do update set status = 'active';

  return lg;
end;
$$;

grant execute on function public.join_league_by_code(text) to authenticated;

-- =====================================================================
-- HELPER FUNCTION: send friend invite (links if user exists)
-- =====================================================================
create or replace function public.send_friend_invite(invite_email text, invite_name text default null)
returns public.friend_invites
language plpgsql
security definer
as $$
declare
  inv public.friend_invites;
  me uuid := auth.uid();
  existing_user uuid;
begin
  if me is null then
    raise exception 'Must be authenticated';
  end if;

  -- Create invite record
  insert into public.friend_invites(inviter_id, email, name)
  values (me, invite_email, invite_name)
  returning * into inv;

  -- If invited user already has an account, auto-link via friendships
  select id into existing_user from auth.users where lower(email) = lower(invite_email) limit 1;
  if existing_user is not null and existing_user != me then
    insert into public.friendships(user_id_a, user_id_b, status, created_by, accepted_at)
    values (least(me, existing_user), greatest(me, existing_user), 'accepted', me, now())
    on conflict (user_id_a, user_id_b) do nothing;

    update public.friend_invites set accepted_user_id = existing_user, accepted_at = now() where id = inv.id;
  end if;

  return inv;
end;
$$;

grant execute on function public.send_friend_invite(text, text) to authenticated;

-- =====================================================================
-- TRIGGER: when a new user signs up, auto-accept any pending invites
-- =====================================================================
create or replace function public.handle_new_user_invites()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Auto-accept all pending invites to this email and create friendships
  insert into public.friendships(user_id_a, user_id_b, status, created_by, accepted_at)
  select
    least(fi.inviter_id, new.id),
    greatest(fi.inviter_id, new.id),
    'accepted',
    fi.inviter_id,
    now()
  from public.friend_invites fi
  where lower(fi.email) = lower(new.email)
    and fi.accepted_user_id is null
    and fi.inviter_id != new.id
  on conflict (user_id_a, user_id_b) do nothing;

  update public.friend_invites
    set accepted_user_id = new.id, accepted_at = now()
  where lower(email) = lower(new.email) and accepted_user_id is null;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_invites on auth.users;
create trigger on_auth_user_created_invites
  after insert on auth.users
  for each row execute function public.handle_new_user_invites();

-- =====================================================================
-- DONE. After running this:
-- 1. Verify tables exist in Table Editor
-- 2. Verify Realtime is enabled on the listed tables
-- 3. Test join_league_by_code('SOMECODE') as an authenticated user
-- 4. Deploy the Edge Functions in /supabase/functions/
-- =====================================================================
