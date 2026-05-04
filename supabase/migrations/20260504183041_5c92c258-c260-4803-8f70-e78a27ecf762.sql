
-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum (
  'super_admin',
  'org_admin',
  'proposal_manager',
  'tender_analyst',
  'reviewer',
  'viewer'
);

create type public.plan_tier as enum ('trial', 'starter', 'professional', 'enterprise');

create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- =========================================================
-- ORGANIZATIONS
-- =========================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan plan_tier not null default 'trial',
  owner_id uuid not null references auth.users(id) on delete restrict,
  logo_url text,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- =========================================================
-- ORGANIZATION MEMBERS
-- =========================================================
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.organization_members enable row level security;

create index idx_org_members_user on public.organization_members(user_id);
create index idx_org_members_org on public.organization_members(organization_id);

-- =========================================================
-- USER ROLES (separate table — security best practice)
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id, role)
);

alter table public.user_roles enable row level security;

create index idx_user_roles_lookup on public.user_roles(user_id, organization_id);

-- =========================================================
-- INVITATIONS
-- =========================================================
create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role app_role not null default 'viewer',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  status invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table public.organization_invitations enable row level security;

create index idx_invites_email on public.organization_invitations(email);
create index idx_invites_org on public.organization_invitations(organization_id);

-- =========================================================
-- SECURITY DEFINER HELPER FUNCTIONS (avoid RLS recursion)
-- =========================================================
create or replace function public.has_role(_user_id uuid, _org_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and (organization_id = _org_id or role = 'super_admin')
      and role = _role
  );
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = 'super_admin'
  );
$$;

create or replace function public.is_org_member(_user_id uuid, _org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where user_id = _user_id and organization_id = _org_id
  ) or public.is_super_admin(_user_id);
$$;

create or replace function public.is_org_admin(_user_id uuid, _org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, _org_id, 'org_admin')
      or public.is_super_admin(_user_id);
$$;

-- =========================================================
-- TIMESTAMP TRIGGER
-- =========================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger trg_orgs_updated before update on public.organizations
  for each row execute function public.update_updated_at_column();

-- =========================================================
-- AUTO-CREATE PROFILE + FIRST-USER SUPER ADMIN
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;

  -- First-ever signup becomes super admin
  select count(*) into user_count from auth.users;
  if user_count <= 1 then
    insert into public.user_roles (user_id, organization_id, role)
    values (new.id, null, 'super_admin')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- RLS POLICIES — PROFILES
-- =========================================================
create policy "Users view own profile or same-org profiles"
on public.profiles for select to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin(auth.uid())
  or exists (
    select 1 from public.organization_members m1
    join public.organization_members m2 on m1.organization_id = m2.organization_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.user_id
  )
);

create policy "Users update own profile"
on public.profiles for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users insert own profile"
on public.profiles for insert to authenticated
with check (user_id = auth.uid());

-- =========================================================
-- RLS POLICIES — ORGANIZATIONS
-- =========================================================
create policy "Members view their organizations"
on public.organizations for select to authenticated
using (public.is_org_member(auth.uid(), id));

create policy "Authenticated users create organizations"
on public.organizations for insert to authenticated
with check (owner_id = auth.uid());

create policy "Org admins update organization"
on public.organizations for update to authenticated
using (public.is_org_admin(auth.uid(), id));

create policy "Owners or super admin delete organization"
on public.organizations for delete to authenticated
using (owner_id = auth.uid() or public.is_super_admin(auth.uid()));

-- =========================================================
-- RLS POLICIES — ORGANIZATION_MEMBERS
-- =========================================================
create policy "Members view co-members"
on public.organization_members for select to authenticated
using (public.is_org_member(auth.uid(), organization_id));

create policy "Org admins add members"
on public.organization_members for insert to authenticated
with check (public.is_org_admin(auth.uid(), organization_id));

create policy "Org admins remove members"
on public.organization_members for delete to authenticated
using (public.is_org_admin(auth.uid(), organization_id) or user_id = auth.uid());

-- =========================================================
-- RLS POLICIES — USER_ROLES
-- =========================================================
create policy "Users view roles in their orgs"
on public.user_roles for select to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin(auth.uid())
  or (organization_id is not null and public.is_org_member(auth.uid(), organization_id))
);

create policy "Org admins assign roles"
on public.user_roles for insert to authenticated
with check (
  organization_id is not null and public.is_org_admin(auth.uid(), organization_id)
);

create policy "Org admins update roles"
on public.user_roles for update to authenticated
using (organization_id is not null and public.is_org_admin(auth.uid(), organization_id));

create policy "Org admins remove roles"
on public.user_roles for delete to authenticated
using (organization_id is not null and public.is_org_admin(auth.uid(), organization_id));

-- =========================================================
-- RLS POLICIES — INVITATIONS
-- =========================================================
create policy "Org members view invitations"
on public.organization_invitations for select to authenticated
using (public.is_org_member(auth.uid(), organization_id));

create policy "Org admins create invitations"
on public.organization_invitations for insert to authenticated
with check (public.is_org_admin(auth.uid(), organization_id) and invited_by = auth.uid());

create policy "Org admins update invitations"
on public.organization_invitations for update to authenticated
using (public.is_org_admin(auth.uid(), organization_id));

create policy "Org admins delete invitations"
on public.organization_invitations for delete to authenticated
using (public.is_org_admin(auth.uid(), organization_id));

-- =========================================================
-- COMPANY_PROFILES — make org-scoped
-- =========================================================
alter table public.company_profiles add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- Drop the existing permissive public policy
drop policy if exists "Allow public access to company_profiles" on public.company_profiles;

create policy "Org members view company profiles"
on public.company_profiles for select to authenticated
using (organization_id is null or public.is_org_member(auth.uid(), organization_id));

create policy "Org members insert company profiles"
on public.company_profiles for insert to authenticated
with check (organization_id is not null and public.is_org_member(auth.uid(), organization_id));

create policy "Org members update company profiles"
on public.company_profiles for update to authenticated
using (organization_id is not null and public.is_org_member(auth.uid(), organization_id));

create policy "Org admins delete company profiles"
on public.company_profiles for delete to authenticated
using (organization_id is not null and public.is_org_admin(auth.uid(), organization_id));

create index if not exists idx_company_profiles_org on public.company_profiles(organization_id);
