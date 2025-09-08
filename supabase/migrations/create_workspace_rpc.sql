-- RPC function to create workspace + membership atomically
-- This avoids RLS recursion during onboarding
-- Exposed RPC used by onboarding to create a workspace + membership
create or replace function create_workspace_with_membership(
  p_name text,
  p_description text default null
)
returns json language plpgsql security definer set search_path = public as $$
declare
  new_ws_id uuid;
  workspace_result json;
begin
  -- must be authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- create workspace
  insert into workspaces (name, description, owner_id, plan_tier, trial_starts_at, trial_ends_at, subscription_status)
  values (
    p_name,
    coalesce(p_description, 'Workspace created during onboarding'),
    auth.uid(),
    'free',
    now(),
    now() + interval '14 days',
    'trialing'
  )
  returning id into new_ws_id;

  -- create owner membership
  insert into workspace_members (workspace_id, user_id, role)
  values (new_ws_id, auth.uid(), 'owner')
  on conflict (workspace_id, user_id) do nothing;

  -- return workspace data
  select json_build_object(
    'id', w.id,
    'name', w.name,
    'description', w.description,
    'owner_id', w.owner_id,
    'plan_tier', w.plan_tier,
    'trial_ends_at', w.trial_ends_at,
    'created_at', w.created_at
  ) into workspace_result
  from workspaces w
  where w.id = new_ws_id;

  return workspace_result;
end;
$$;

-- Ensure API roles can call it
grant execute on function create_workspace_with_membership(text, text) to anon, authenticated;
