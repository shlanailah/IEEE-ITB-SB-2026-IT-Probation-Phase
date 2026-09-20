-- ============================================================================
-- IEEE ITB Student Branch — Supabase schema
-- ----------------------------------------------------------------------------
-- RUN ORDER: 1) schema.sql  2) seed.sql
-- Run BOTH in the Supabase SQL Editor (as the postgres role) for your project.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES (User / Admin entity)
-- ----------------------------------------------------------------------------
-- Supabase Auth (auth.users) stores the login credentials.
-- This table adds a readable username + role for the application,
-- satisfying the "User/Admin" entity requirement.
create table if not exists public.profiles (
    id         uuid primary key references auth.users (id) on delete cascade,
    username   text not null unique check (char_length(trim(username)) between 3 and 40),
    role       text not null default 'admin' check (role in ('admin')),
    created_at timestamptz not null default now()
);

comment on table public.profiles is 'Admin accounts linked to Supabase Auth users';

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create table if not exists public.events (
    id          uuid primary key default gen_random_uuid(),
    title       text not null check (char_length(trim(title)) between 1 and 200),
    description text not null check (char_length(trim(description)) between 1 and 5000),
    date        date not null,
    time        time not null,
    location    text not null check (char_length(trim(location)) between 1 and 200),
    status      text not null check (status in ('upcoming', 'ongoing', 'past')),
    image_url   text check (image_url is null or char_length(image_url) <= 500),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

comment on table public.events is 'Events managed by the admin team';

create index if not exists events_status_idx on public.events (status);
create index if not exists events_date_idx   on public.events (date desc);

-- Keep updated_at fresh on every update (backend-level bookkeeping).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists events_touch_updated on public.events;
create trigger events_touch_updated
    before update on public.events
    for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events  enable row level security;

-- Helper used by RLS policies: is the current user a registered admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
    );
$$;

-- EVENTS ---------------------------------------------------------------------
-- Anyone (anonymous public user) may READ events.
-- Only authenticated admins may INSERT / UPDATE / DELETE (backend access control).
create policy "events_select_public" on public.events
    for select using (true);

create policy "events_insert_admin" on public.events
    for insert with check (public.is_admin());

create policy "events_update_admin" on public.events
    for update using (public.is_admin());

create policy "events_delete_admin" on public.events
    for delete using (public.is_admin());

-- PROFILES -------------------------------------------------------------------
-- Everyone may read profiles (needed to fetch a given session's profile).
-- Only the owner may insert/update their own profile row.
create policy "profiles_select_public" on public.profiles
    for select using (true);

create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id);