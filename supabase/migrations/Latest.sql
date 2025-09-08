-- Extensions
create extension if not exists pgcrypto with schema public;

-- Helper: drop safely
do $$
begin
  perform 1;
exception when others then
  null;
end $$;

-- Optional: cleanup (drop in order of fkeys)
drop table if exists portfolio_projects cascade;
drop table if exists portfolios cascade;
drop table if exists task_comments cascade;
drop table if exists timelogs cascade;
drop table if exists invites cascade;
drop table if exists tasks cascade;
drop table if exists projects cascade;
drop table if exists workspace_members cascade;
drop table if exists workspaces cascade;
drop table if exists profiles cascade;

drop function if exists handle_new_user() cascade;
drop function if exists is_workspace_member(uuid) cascade;
drop function if exists is_workspace_admin(uuid) cascade;
drop function if exists accept_invite(uuid) cascade;

-- 1) Core identities
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  avatar_url text,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Workspaces (tenant)
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references profiles(id) on delete cascade,
  -- billing
  plan_tier text not null default 'free' check (plan_tier in ('free','pro')),
  trial_starts_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  stripe_subscription_id text,
  subscription_status text, -- trialing, active, past_due, canceled, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Workspace membership
create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user on workspace_members(user_id);
create index if not exists idx_workspace_members_ws on workspace_members(workspace_id);

-- 4) Portfolios (group projects within a workspace)
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  start_date date not null default (now()::date),
  end_date date,
  status text not null default 'planning' check (status in ('planning','active','on_hold','completed','cancelled')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_by uuid not null references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_workspace on projects(workspace_id);

-- 6) Portfolio <-> Projects mapping (enforce same workspace)
create table if not exists portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (portfolio_id, project_id)
);

-- 7) Tasks (denormalize workspace_id for easy filtering)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  parent_id uuid references tasks(id) on delete cascade,
  name text not null,
  description text,
  start_date date not null default (now()::date),
  end_date date not null default ((now() + interval '1 day')::date),
  duration integer not null default 1,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','on_hold')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  assigned_to uuid references profiles(id) on delete set null,
  created_by uuid not null references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_workspace on tasks(workspace_id);
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_parent on tasks(parent_id);
create index if not exists idx_tasks_assigned on tasks(assigned_to);

-- 8) Communication hub: task comments
create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  attachments jsonb, -- optional: [{name,url,size}], use storage for files
  created_at timestamptz not null default now()
);
create index if not exists idx_task_comments_task on task_comments(task_id);
create index if not exists idx_task_comments_workspace on task_comments(workspace_id);

-- 9) Invites for workspace
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin','member','viewer')),
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  invited_by uuid not null references profiles(id) on delete set null,
  accepted_by uuid references profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  unique (workspace_id, email, status) deferrable initially immediate
);
create index if not exists idx_invites_workspace on invites(workspace_id);
create index if not exists idx_invites_email on invites(email);

-- 10) Time logs
create table if not exists timelogs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  user_id uuid not null references profiles(id) on delete cascade,
  minutes integer not null check (minutes >= 0),
  date date not null default (now()::date),
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_timelogs_workspace on timelogs(workspace_id);
create index if not exists idx_timelogs_user on timelogs(user_id);

-- 11) RLS
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table portfolios enable row level security;
alter table portfolio_projects enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table invites enable row level security;
alter table timelogs enable row level security;

-- Helper functions for RLS
create or replace function is_workspace_member(p_workspace_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable as $$
begin
  return exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid()
  );
end;
$$;

create or replace function is_workspace_admin(p_workspace_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable as $$
begin
  return exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid() and role in ('owner','admin')
  );
end;
$$;

-- Profiles policies
create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Workspaces policies
create policy "workspaces_select_member"
  on workspaces for select
  to authenticated
  using (is_workspace_member(id));

create policy "workspaces_insert_owner"
  on workspaces for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "workspaces_update_owner_admin"
  on workspaces for update
  to authenticated
  using (is_workspace_admin(id))
  with check (is_workspace_admin(id));

-- Workspace members policies
-- Avoid recursive policy by checking direct ownership only
drop policy if exists "wm_select_member" on workspace_members;
create policy "wm_select_self"
  on workspace_members for select
  to authenticated
  using (user_id = auth.uid());

create policy "wm_manage_admins"
  on workspace_members for all
  to authenticated
  using (is_workspace_admin(workspace_id))
  with check (is_workspace_admin(workspace_id));

-- Portfolios policies
create policy "portfolios_select_member"
  on portfolios for select
  to authenticated
  using (is_workspace_member(workspace_id));

create policy "portfolios_insert_member"
  on portfolios for insert
  to authenticated
  with check (is_workspace_member(workspace_id));

create policy "portfolios_update_admin"
  on portfolios for update
  to authenticated
  using (is_workspace_admin(workspace_id))
  with check (is_workspace_admin(workspace_id));

create policy "portfolios_delete_admin"
  on portfolios for delete
  to authenticated
  using (is_workspace_admin(workspace_id));

-- Portfolio_projects policies (enforce same workspace via checks)
create policy "pp_select_member"
  on portfolio_projects for select
  to authenticated
  using (
    exists (
      select 1
      from portfolios p
      join projects pr on pr.id = portfolio_projects.project_id
      where p.id = portfolio_projects.portfolio_id
        and p.workspace_id = pr.workspace_id
        and is_workspace_member(p.workspace_id)
    )
  );

create policy "pp_insert_admin"
  on portfolio_projects for insert
  to authenticated
  with check (
    exists (
      select 1
      from portfolios p
      join projects pr on pr.id = portfolio_projects.project_id
      where p.id = portfolio_projects.portfolio_id
        and p.workspace_id = pr.workspace_id
        and is_workspace_admin(p.workspace_id)
    )
  );

create policy "pp_delete_admin"
  on portfolio_projects for delete
  to authenticated
  using (
    exists (
      select 1
      from portfolios p
      join projects pr on pr.id = portfolio_projects.project_id
      where p.id = portfolio_projects.portfolio_id
        and p.workspace_id = pr.workspace_id
        and is_workspace_admin(p.workspace_id)
    )
  );

-- Projects policies
create policy "projects_select_member"
  on projects for select
  to authenticated
  using (is_workspace_member(workspace_id));

create policy "projects_insert_member"
  on projects for insert
  to authenticated
  with check (is_workspace_member(workspace_id));

create policy "projects_update_admin"
  on projects for update
  to authenticated
  using (is_workspace_admin(workspace_id))
  with check (is_workspace_admin(workspace_id));

-- Tasks policies
create policy "tasks_select_member"
  on tasks for select
  to authenticated
  using (is_workspace_member(workspace_id));

create policy "tasks_insert_member"
  on tasks for insert
  to authenticated
  with check (is_workspace_member(workspace_id));

create policy "tasks_update_admin_member"
  on tasks for update
  to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

-- Task comments policies
create policy "comments_select_member"
  on task_comments for select
  to authenticated
  using (is_workspace_member(workspace_id));

create policy "comments_insert_member"
  on task_comments for insert
  to authenticated
  with check (is_workspace_member(workspace_id));

-- Invites policies
create policy "invites_select_admin"
  on invites for select
  to authenticated
  using (is_workspace_admin(workspace_id));

create policy "invites_insert_admin"
  on invites for insert
  to authenticated
  with check (is_workspace_admin(workspace_id));

create policy "invites_update_admin"
  on invites for update
  to authenticated
  using (is_workspace_admin(workspace_id))
  with check (is_workspace_admin(workspace_id));

-- Time logs policies
create policy "timelogs_select_member"
  on timelogs for select
  to authenticated
  using (is_workspace_member(workspace_id));

create policy "timelogs_insert_member"
  on timelogs for insert
  to authenticated
  with check (is_workspace_member(workspace_id) and user_id = auth.uid());

create policy "timelogs_update_owner_or_admin"
  on timelogs for update
  to authenticated
  using (is_workspace_member(workspace_id) and (user_id = auth.uid() or is_workspace_admin(workspace_id)))
  with check (is_workspace_member(workspace_id) and (user_id = auth.uid() or is_workspace_admin(workspace_id)));

-- 12) On signup: create profile + default workspace with 14-day trial & membership
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_ws_id uuid;
begin
  insert into profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name','')
  ) on conflict (id) do nothing;

  insert into workspaces (name, description, owner_id, plan_tier, trial_starts_at, trial_ends_at, subscription_status)
  values (
    coalesce(new.raw_user_meta_data->>'business_name', split_part(new.email,'@',1) || ' Workspace'),
    'Default workspace',
    new.id,
    'free',
    now(),
    now() + interval '14 days',
    'trialing'
  )
  returning id into new_ws_id;

  insert into workspace_members (workspace_id, user_id, role)
  values (new_ws_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 13) Invite acceptance: token to membership
create or replace function accept_invite(p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_inv invites%rowtype;
begin
  select * into v_inv
  from invites
  where token = p_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invite not found or expired';
  end if;

  -- must be authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- add member
  insert into workspace_members (workspace_id, user_id, role)
  values (v_inv.workspace_id, auth.uid(), coalesce(v_inv.role,'member'))
  on conflict (workspace_id, user_id) do nothing;

  update invites
  set status = 'accepted',
      accepted_by = auth.uid()
  where id = v_inv.id;
end;
$$;

-- 14) Views to simplify front-end (owner name on projects)
create or replace view project_with_owner as
select
  p.*,
  pr.first_name as owner_first_name,
  pr.last_name as owner_last_name,
  pr.email as owner_email
from projects p
left join profiles pr on pr.id = p.created_by;

-- RLS for view uses underlying tables’ policies; optionally grant to authenticated
grant select on project_with_owner to authenticated;

-- 15) Ensure policies for viewable tables are granted to authenticated
grant usage on schema public to authenticated;

-- Refresh PostgREST schema cache after changes
notify pgrst, 'reload schema';