-- Create SECURITY DEFINER RPC to insert workspace invites without RLS issues
-- This function attempts to insert into public.invites if present, otherwise
-- falls back to legacy public.workspace_invitations.

-- Drop existing function if it exists, to handle signature changes
drop function if exists public.create_workspace_invite(uuid,text,text);

create or replace function public.create_workspace_invite(
  p_workspace_id uuid,
  p_email text,
  p_role text default 'member'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
  v_expires_at timestamptz;
  v_row jsonb;
begin
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(16), 'hex');
  v_expires_at := now() + interval '7 days';

  -- Check for modern 'invites' table first
  if to_regclass('public.invites') is not null then
    insert into public.invites(workspace_id, email, role, invited_by, token, expires_at, status)
    values (p_workspace_id, p_email, p_role, auth.uid(), v_token, v_expires_at, 'pending')
    returning to_jsonb(invites.*) into v_row;
    return v_row;
  
  -- Fallback to legacy 'workspace_invitations' table
  elsif to_regclass('public.workspace_invitations') is not null then
    insert into public.workspace_invitations(workspace_id, email, role, invited_by, token, expires_at)
    values (p_workspace_id, p_email, p_role, auth.uid(), v_token, v_expires_at)
    returning to_jsonb(workspace_invitations.*) into v_row;
    return v_row;

  -- If neither table exists, raise an error
  else
    raise exception 'No invites table found (neither public.invites nor public.workspace_invitations)';
  end if;
end;
$$;

-- Grant permissions for API usage
grant execute on function public.create_workspace_invite(uuid, text, text) to anon, authenticated;
