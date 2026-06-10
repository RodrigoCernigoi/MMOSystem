create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  player jsonb not null,
  progression jsonb not null default '{"projects":[],"masterQuests":[],"skills":[],"bosses":[]}'::jsonb,
  rewards jsonb not null default '[]'::jsonb,
  focus_sessions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists progression jsonb not null default '{"projects":[],"masterQuests":[],"skills":[],"bosses":[]}'::jsonb;

alter table public.profiles
  add column if not exists rewards jsonb not null default '[]'::jsonb;

alter table public.profiles
  add column if not exists focus_sessions jsonb not null default '[]'::jsonb;

create table if not exists public.quests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quest jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.quests enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "quests_select_own" on public.quests;
drop policy if exists "quests_insert_own" on public.quests;
drop policy if exists "quests_update_own" on public.quests;
drop policy if exists "quests_delete_own" on public.quests;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

create policy "quests_select_own"
  on public.quests for select
  using (auth.uid() = user_id);

create policy "quests_insert_own"
  on public.quests for insert
  with check (auth.uid() = user_id);

create policy "quests_update_own"
  on public.quests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quests_delete_own"
  on public.quests for delete
  using (auth.uid() = user_id);
