-- Temporary fix for RLS policies to avoid workspace_members infinite recursion
-- This script updates the policies to use workspace ownership instead of membership

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read workspaces they belong to" ON workspaces;
DROP POLICY IF EXISTS "Users can read workspace members for their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Users can read invitations for their workspaces" ON workspace_invitations;
DROP POLICY IF EXISTS "Workspace admins can manage invitations" ON workspace_invitations;
DROP POLICY IF EXISTS "Users can read projects in their workspaces" ON projects;
DROP POLICY IF EXISTS "Users can create projects in their workspaces" ON projects;
DROP POLICY IF EXISTS "Users can update projects in their workspaces" ON projects;
DROP POLICY IF EXISTS "Users can read tasks in their workspace projects" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their workspace projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their workspace projects" ON tasks;

-- Also drop existing workspace policies that might conflict
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can read their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can read projects in owned workspaces" ON projects;
DROP POLICY IF EXISTS "Users can create projects in owned workspaces" ON projects;
DROP POLICY IF EXISTS "Users can update projects in owned workspaces" ON projects;
DROP POLICY IF EXISTS "Users can read tasks in owned workspace projects" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in owned workspace projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in owned workspace projects" ON tasks;

-- Create simplified policies based on workspace ownership
CREATE POLICY "Users can read their own workspaces" ON workspaces
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update their workspaces" ON workspaces
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- Temporarily disable workspace_members policies to avoid recursion
-- We'll re-enable them later when the membership system is properly implemented
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- Create owner-based policies for projects
CREATE POLICY "Users can read projects in owned workspaces" ON projects
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces 
    WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can create projects in owned workspaces" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces 
    WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update projects in owned workspaces" ON projects
  FOR UPDATE TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces 
    WHERE owner_id = auth.uid()
  ));

-- Create owner-based policies for tasks
CREATE POLICY "Users can read tasks in owned workspace projects" ON tasks
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in owned workspace projects" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks in owned workspace projects" ON tasks
  FOR UPDATE TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = auth.uid()
  ));

-- Update workspace invitations policies
DROP POLICY IF EXISTS "Users can read invitations for owned workspaces" ON workspace_invitations;
DROP POLICY IF EXISTS "Workspace owners can manage invitations" ON workspace_invitations;

CREATE POLICY "Users can read invitations for owned workspaces" ON workspace_invitations
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces 
    WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Workspace owners can manage invitations" ON workspace_invitations
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces 
    WHERE owner_id = auth.uid()
  ));

-- Update project roles policies
DROP POLICY IF EXISTS "Users can read project roles for owned workspace projects" ON project_roles;
DROP POLICY IF EXISTS "Workspace owners can manage project roles" ON project_roles;

CREATE POLICY "Users can read project roles for owned workspace projects" ON project_roles
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = auth.uid()
  ));

CREATE POLICY "Workspace owners can manage project roles" ON project_roles
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = auth.uid()
  ));
