create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'Admin',
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  project_type text,
  phase text,
  status text default 'New',
  priority text default 'Medium',
  objective text,
  pain_statement text,
  estimated_savings text,
  linked_tools text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_outputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  output_type text,
  tool_name text,
  status text default 'Saved',
  content text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'Admin')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_outputs enable row level security;

drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own"
on public.profiles for update
using (auth.uid() = id);

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects for select
using (auth.uid() = owner_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects for insert
with check (auth.uid() = owner_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects for update
using (auth.uid() = owner_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects for delete
using (auth.uid() = owner_id);

drop policy if exists "outputs_select_by_owner" on public.project_outputs;
create policy "outputs_select_by_owner"
on public.project_outputs for select
using (
  exists (
    select 1 from public.projects p
    where p.id = project_outputs.project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "outputs_insert_by_owner" on public.project_outputs;
create policy "outputs_insert_by_owner"
on public.project_outputs for insert
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_outputs.project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "outputs_update_by_owner" on public.project_outputs;
create policy "outputs_update_by_owner"
on public.project_outputs for update
using (
  exists (
    select 1 from public.projects p
    where p.id = project_outputs.project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "outputs_delete_by_owner" on public.project_outputs;
create policy "outputs_delete_by_owner"
on public.project_outputs for delete
using (
  exists (
    select 1 from public.projects p
    where p.id = project_outputs.project_id and p.owner_id = auth.uid()
  )
);
