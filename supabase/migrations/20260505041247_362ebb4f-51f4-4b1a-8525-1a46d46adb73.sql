-- Enums
do $$ begin
  create type public.tender_stage as enum ('new','screening','bid_prep','submitted','won','lost','dropped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tender_priority as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proposal_status as enum ('draft','in_review','approved','submitted','archived');
exception when duplicate_object then null; end $$;

-- Tenders
create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  created_by uuid not null,
  assignee_id uuid,
  title text not null,
  reference_no text,
  buyer text,
  department text,
  category text,
  source_url text,
  estimated_value numeric,
  emd_amount numeric,
  publish_date date,
  submission_deadline timestamptz,
  opening_date timestamptz,
  stage public.tender_stage not null default 'new',
  priority public.tender_priority not null default 'medium',
  notes text,
  tags text[] default '{}',
  raw_requirements jsonb,
  eligibility jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenders_org on public.tenders(organization_id);
create index if not exists idx_tenders_stage on public.tenders(organization_id, stage);
create index if not exists idx_tenders_deadline on public.tenders(organization_id, submission_deadline);

alter table public.tenders enable row level security;

create policy "Org members view tenders" on public.tenders
  for select to authenticated
  using (public.is_org_member(auth.uid(), organization_id));

create policy "Org members create tenders" on public.tenders
  for insert to authenticated
  with check (public.is_org_member(auth.uid(), organization_id) and created_by = auth.uid());

create policy "Org members update tenders" on public.tenders
  for update to authenticated
  using (public.is_org_member(auth.uid(), organization_id));

create policy "Org admins delete tenders" on public.tenders
  for delete to authenticated
  using (public.is_org_admin(auth.uid(), organization_id));

create trigger trg_tenders_updated_at
before update on public.tenders
for each row execute function public.update_updated_at_column();

-- Proposals
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  tender_id uuid not null references public.tenders(id) on delete cascade,
  created_by uuid not null,
  reviewer_id uuid,
  title text not null,
  status public.proposal_status not null default 'draft',
  version int not null default 1,
  content text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposals_org on public.proposals(organization_id);
create index if not exists idx_proposals_tender on public.proposals(tender_id);

alter table public.proposals enable row level security;

create policy "Org members view proposals" on public.proposals
  for select to authenticated
  using (public.is_org_member(auth.uid(), organization_id));

create policy "Org members create proposals" on public.proposals
  for insert to authenticated
  with check (public.is_org_member(auth.uid(), organization_id) and created_by = auth.uid());

create policy "Org members update proposals" on public.proposals
  for update to authenticated
  using (public.is_org_member(auth.uid(), organization_id));

create policy "Org admins delete proposals" on public.proposals
  for delete to authenticated
  using (public.is_org_admin(auth.uid(), organization_id));

create trigger trg_proposals_updated_at
before update on public.proposals
for each row execute function public.update_updated_at_column();