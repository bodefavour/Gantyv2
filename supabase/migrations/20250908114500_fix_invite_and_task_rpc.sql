-- Fix create_workspace_invite to use uuid token and add create_task_secure RPC
-- Drop old duplicate definitions
drop function if exists public.create_workspace_invite(uuid,text,text);

create or replace function public.create_workspace_invite(
  p_workspace_id uuid,
  p_email text,
  p_role text default 'member'
)
returns table (id uuid, token uuid) as $$
declare
  v_token uuid := gen_random_uuid();
  v_id uuid;
  has_invites boolean;
begin
  has_invites := to_regclass('public.invites') is not null;
  if has_invites then
    insert into public.invites(workspace_id, email, role, invited_by, token, expires_at, status)
    values (p_workspace_id, p_email, p_role, auth.uid(), v_token, now() + interval '7 days', 'pending')
    returning invites.id into v_id;
  else
    raise exception 'invites table not found';
  end if;
  return query select v_id, v_token;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.create_workspace_invite(uuid,text,text) from public;
grant execute on function public.create_workspace_invite(uuid,text,text) to anon, authenticated;

-- Secure task creation (allows milestone creation even if client constrained by RLS policies that permit insert already; kept for future elevated flows)
drop function if exists public.create_task_secure(uuid,uuid,text,date,date,integer,boolean);
create or replace function public.create_task_secure(
  p_workspace_id uuid,
  p_project_id uuid,
  p_name text,
  p_start date,
  p_end date,
  p_duration integer default 1,
  p_is_milestone boolean default false
)
returns uuid as $$
declare
  v_id uuid;
begin
  -- basic guard: ensure caller is member of workspace
  if not exists (
    select 1 from workspace_members wm where wm.workspace_id = p_workspace_id and wm.user_id = auth.uid()
  ) then
    raise exception 'Not a workspace member';
  end if;

  insert into tasks(workspace_id, project_id, name, start_date, end_date, duration, progress, status, priority, created_by, is_milestone)
  values (p_workspace_id, p_project_id, p_name, p_start, p_end, p_duration, 0, 'not_started', 'medium', auth.uid(), p_is_milestone)
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.create_task_secure(uuid,uuid,text,date,date,integer,boolean) to authenticated;