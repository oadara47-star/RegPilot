-- RegPilot Production MVP schema
-- Run this in Supabase SQL Editor before deploying the app.

create extension if not exists "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('regulatory_manager', 'department_manager', 'control_owner', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE obligation_status AS ENUM ('not_started', 'in_progress', 'awaiting_review', 'completed', 'overdue', 'not_applicable');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sender_email text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'control_owner',
  department text,
  created_at timestamptz not null default now()
);

create table if not exists regulatory_lines (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null,
  regulator text not null,
  default_owner_department text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists user_line_access (
  user_id uuid not null references profiles(id) on delete cascade,
  regulatory_line_id uuid not null references regulatory_lines(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, regulatory_line_id)
);

create table if not exists obligations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  regulatory_line_id uuid not null references regulatory_lines(id) on delete cascade,
  title text not null,
  regulator text not null,
  frequency text not null,
  due_day_rule text not null,
  next_due_date date not null,
  status obligation_status not null default 'not_started',
  priority priority_level not null default 'medium',
  owner_id uuid references profiles(id),
  reviewer_id uuid references profiles(id),
  approver_id uuid references profiles(id),
  formula text,
  required_inputs text[],
  internal_documents_to_retain text[],
  computation_optional boolean not null default true,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reminder_settings (
  company_id uuid primary key references companies(id) on delete cascade,
  sender_name text not null default 'RegPilot Compliance Desk',
  sender_email text,
  weekly_day text not null default 'Monday',
  weekly_time text not null default '07:00',
  lookahead_days int not null default 7,
  followup_frequency_days int not null default 2,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists reminder_log (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  item_count int not null default 0,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

alter table companies enable row level security;
alter table profiles enable row level security;
alter table regulatory_lines enable row level security;
alter table user_line_access enable row level security;
alter table obligations enable row level security;
alter table reminder_settings enable row level security;
alter table reminder_log enable row level security;

-- Helper: current user's company
create or replace function current_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from profiles where id = auth.uid()
$$;

create or replace function current_user_role()
returns user_role
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid()
$$;

-- Drop policies if rerunning during setup
DROP POLICY IF EXISTS "company_select" ON companies;
DROP POLICY IF EXISTS "profiles_select_company" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "lines_select_access" ON regulatory_lines;
DROP POLICY IF EXISTS "user_line_select_company" ON user_line_access;
DROP POLICY IF EXISTS "obligations_select_access" ON obligations;
DROP POLICY IF EXISTS "obligations_update_access" ON obligations;
DROP POLICY IF EXISTS "settings_select_manager" ON reminder_settings;
DROP POLICY IF EXISTS "settings_upsert_manager" ON reminder_settings;
DROP POLICY IF EXISTS "log_select_manager" ON reminder_log;

create policy "company_select" on companies for select using (id = current_company_id());

create policy "profiles_select_company" on profiles for select using (
  company_id = current_company_id()
);

create policy "profiles_update_self" on profiles for update using (id = auth.uid());

create policy "lines_select_access" on regulatory_lines for select using (
  company_id = current_company_id()
  and (
    current_user_role() in ('regulatory_manager', 'department_manager')
    or exists (
      select 1 from user_line_access ula
      where ula.user_id = auth.uid() and ula.regulatory_line_id = regulatory_lines.id
    )
  )
);

create policy "user_line_select_company" on user_line_access for select using (
  exists (
    select 1 from profiles p where p.id = user_line_access.user_id and p.company_id = current_company_id()
  )
);

create policy "obligations_select_access" on obligations for select using (
  company_id = current_company_id()
  and (
    current_user_role() in ('regulatory_manager', 'department_manager')
    or owner_id = auth.uid()
    or reviewer_id = auth.uid()
    or approver_id = auth.uid()
    or exists (
      select 1 from user_line_access ula
      where ula.user_id = auth.uid() and ula.regulatory_line_id = obligations.regulatory_line_id
    )
  )
);

create policy "obligations_update_access" on obligations for update using (
  company_id = current_company_id()
  and (
    current_user_role() in ('regulatory_manager', 'department_manager')
    or owner_id = auth.uid()
    or reviewer_id = auth.uid()
    or approver_id = auth.uid()
  )
);

create policy "settings_select_manager" on reminder_settings for select using (
  company_id = current_company_id() and current_user_role() in ('regulatory_manager', 'department_manager')
);

create policy "settings_upsert_manager" on reminder_settings for all using (
  company_id = current_company_id() and current_user_role() = 'regulatory_manager'
) with check (
  company_id = current_company_id() and current_user_role() = 'regulatory_manager'
);

create policy "log_select_manager" on reminder_log for select using (
  company_id = current_company_id() and current_user_role() in ('regulatory_manager', 'department_manager')
);
