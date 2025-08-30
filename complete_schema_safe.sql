/*
  # Complete Ganty Database Schema - Safe Execution
  # This script can be run multiple times safely in Supabase SQL Editor
  # It handles all existing objects gracefully and ensures your schema is up to date
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 1: CLEAN UP EXISTING OBJECTS
-- =============================================================================

-- Drop all existing policies to avoid conflicts
DO $$
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    
    -- Workspaces policies
    DROP POLICY IF EXISTS "Users can read workspaces they belong to" ON workspaces;
    DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
    DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON workspaces;
    
    -- Workspace members policies
    DROP POLICY IF EXISTS "Users can read workspace members for their workspaces" ON workspace_members;
    DROP POLICY IF EXISTS "Workspace admins can manage members" ON workspace_members;
    
    -- Workspace invitations policies
    DROP POLICY IF EXISTS "Users can read invitations for their workspaces" ON workspace_invitations;
    DROP POLICY IF EXISTS "Workspace admins can manage invitations" ON workspace_invitations;
    
    -- Projects policies
    DROP POLICY IF EXISTS "Users can read projects in their workspaces" ON projects;
    DROP POLICY IF EXISTS "Users can create projects in their workspaces" ON projects;
    DROP POLICY IF EXISTS "Users can update projects in their workspaces" ON projects;
    
    -- Project roles policies
    DROP POLICY IF EXISTS "Users can read project roles for accessible projects" ON project_roles;
    DROP POLICY IF EXISTS "Project managers can manage project roles" ON project_roles;
    
    -- Tasks policies
    DROP POLICY IF EXISTS "Users can read tasks in their workspace projects" ON tasks;
    DROP POLICY IF EXISTS "Users can create tasks in their workspace projects" ON tasks;
    DROP POLICY IF EXISTS "Users can update tasks in their workspace projects" ON tasks;
    
    -- Task dependencies policies
    DROP POLICY IF EXISTS "Users can read dependencies for accessible tasks" ON task_dependencies;
    DROP POLICY IF EXISTS "Users can manage dependencies for accessible tasks" ON task_dependencies;
    
    -- Milestones policies
    DROP POLICY IF EXISTS "Users can read milestones in their workspace projects" ON milestones;
    DROP POLICY IF EXISTS "Users can manage milestones in their workspace projects" ON milestones;
    
    -- Custom fields policies
    DROP POLICY IF EXISTS "Users can read custom fields in their workspaces" ON custom_fields;
    DROP POLICY IF EXISTS "Workspace admins can manage custom fields" ON custom_fields;
    
    -- Task custom values policies
    DROP POLICY IF EXISTS "Users can read task custom values for accessible tasks" ON task_custom_values;
    DROP POLICY IF EXISTS "Users can manage task custom values for accessible tasks" ON task_custom_values;
    
    -- Project custom values policies
    DROP POLICY IF EXISTS "Users can read project custom values for accessible projects" ON project_custom_values;
    DROP POLICY IF EXISTS "Users can manage project custom values for accessible projects" ON project_custom_values;
    
    -- Activity logs policies
    DROP POLICY IF EXISTS "Users can read activity logs for their workspaces" ON activity_logs;
    DROP POLICY IF EXISTS "Users can create activity logs for their workspaces" ON activity_logs;
    
    -- Comments policies
    DROP POLICY IF EXISTS "Users can read comments for accessible projects/tasks" ON comments;
    DROP POLICY IF EXISTS "Users can create comments for accessible projects/tasks" ON comments;
    DROP POLICY IF EXISTS "Users can update own comments" ON comments;
    
    -- File attachments policies
    DROP POLICY IF EXISTS "Users can read attachments in their workspaces" ON file_attachments;
    DROP POLICY IF EXISTS "Users can upload attachments to their workspaces" ON file_attachments;
    
    -- Notifications policies
    DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    
    -- Export jobs policies
    DROP POLICY IF EXISTS "Users can read own export jobs" ON export_jobs;
    DROP POLICY IF EXISTS "Users can create export jobs for their workspaces" ON export_jobs;
    
    -- API keys policies
    DROP POLICY IF EXISTS "Users can read API keys for their workspaces" ON api_keys;
    DROP POLICY IF EXISTS "Workspace admins can manage API keys" ON api_keys;
    
    -- Portfolios policies
    DROP POLICY IF EXISTS "Users can read portfolios in their workspaces" ON portfolios;
    DROP POLICY IF EXISTS "Users can manage portfolios in their workspaces" ON portfolios;
    
    -- Portfolio projects policies
    DROP POLICY IF EXISTS "Users can read portfolio projects for accessible portfolios" ON portfolio_projects;
    DROP POLICY IF EXISTS "Users can manage portfolio projects for accessible portfolios" ON portfolio_projects;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors when policies don't exist
        NULL;
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS calculate_project_progress_trigger ON tasks;
DROP TRIGGER IF EXISTS log_workspace_activity ON workspaces;
DROP TRIGGER IF EXISTS log_project_activity ON projects;
DROP TRIGGER IF EXISTS log_task_activity ON tasks;
DROP TRIGGER IF EXISTS log_milestone_activity ON milestones;
DROP TRIGGER IF EXISTS check_dependencies_trigger ON task_dependencies;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS calculate_project_progress() CASCADE;
DROP FUNCTION IF EXISTS log_activity() CASCADE;
DROP FUNCTION IF EXISTS check_task_dependencies() CASCADE;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_workspace_members_user_id;
DROP INDEX IF EXISTS idx_workspace_members_workspace_id;
DROP INDEX IF EXISTS idx_projects_workspace_id;
DROP INDEX IF EXISTS idx_tasks_project_id;
DROP INDEX IF EXISTS idx_tasks_parent_id;
DROP INDEX IF EXISTS idx_tasks_assigned_to;
DROP INDEX IF EXISTS idx_task_dependencies_predecessor;
DROP INDEX IF EXISTS idx_task_dependencies_successor;
DROP INDEX IF EXISTS idx_activity_logs_workspace_id;
DROP INDEX IF EXISTS idx_activity_logs_project_id;
DROP INDEX IF EXISTS idx_activity_logs_created_at;
DROP INDEX IF EXISTS idx_comments_project_id;
DROP INDEX IF EXISTS idx_comments_task_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_read_at;

-- =============================================================================
-- STEP 2: CREATE TABLES
-- =============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  date_format text DEFAULT 'MM/dd/yyyy',
  time_format text DEFAULT '12h',
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logo_url text,
  brand_color text DEFAULT '#0891b2',
  domain text,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions jsonb DEFAULT '{}',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  color text DEFAULT '#3b82f6',
  is_template boolean DEFAULT false,
  template_id uuid REFERENCES projects(id),
  settings jsonb DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project roles table (project-specific permissions)
CREATE TABLE IF NOT EXISTS project_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager', 'member', 'viewer')),
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration integer DEFAULT 1,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to uuid REFERENCES profiles(id),
  estimated_hours decimal(8,2),
  actual_hours decimal(8,2) DEFAULT 0,
  color text DEFAULT '#3b82f6',
  is_milestone boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  successor_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type text DEFAULT 'finish_to_start' CHECK (type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(predecessor_id, successor_id)
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  color text DEFAULT '#ef4444',
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Custom fields table
CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multi_select', 'boolean')),
  options jsonb DEFAULT '[]',
  is_required boolean DEFAULT false,
  applies_to text NOT NULL CHECK (applies_to IN ('projects', 'tasks', 'both')),
  created_at timestamptz DEFAULT now()
);

-- Task custom values table
CREATE TABLE IF NOT EXISTS task_custom_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  custom_field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, custom_field_id)
);

-- Project custom values table
CREATE TABLE IF NOT EXISTS project_custom_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  custom_field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, custom_field_id)
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('workspace', 'project', 'task', 'milestone', 'member')),
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentions uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)
);

-- File attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Export jobs table
CREATE TABLE IF NOT EXISTS export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  export_type text NOT NULL CHECK (export_type IN ('pdf', 'excel', 'csv', 'png', 'svg')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  permissions jsonb DEFAULT '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#8b5cf6',
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Portfolio projects table
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_id, project_id)
);

-- =============================================================================
-- STEP 3: CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- =============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 5: CREATE SECURITY POLICIES
-- =============================================================================

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Users can read workspaces they belong to" ON workspaces
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update their workspaces" ON workspaces
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Users can read workspace members for their workspaces" ON workspace_members
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Workspace admins can manage members" ON workspace_members
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Workspace invitations policies
CREATE POLICY "Users can read invitations for their workspaces" ON workspace_invitations
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Workspace admins can manage invitations" ON workspace_invitations
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Projects policies
CREATE POLICY "Users can read projects in their workspaces" ON projects
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create projects in their workspaces" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ));

CREATE POLICY "Users can update projects in their workspaces" ON projects
  FOR UPDATE TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ));

-- Project roles policies
CREATE POLICY "Users can read project roles for accessible projects" ON project_roles
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  ));

CREATE POLICY "Project managers can manage project roles" ON project_roles
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin')
  ));

-- Tasks policies
CREATE POLICY "Users can read tasks in their workspace projects" ON tasks
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in their workspace projects" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ));

CREATE POLICY "Users can update tasks in their workspace projects" ON tasks
  FOR UPDATE TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ));

-- Task dependencies policies
CREATE POLICY "Users can read dependencies for accessible tasks" ON task_dependencies
  FOR SELECT TO authenticated
  USING (predecessor_id IN (
    SELECT t.id FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage dependencies for accessible tasks" ON task_dependencies
  FOR ALL TO authenticated
  USING (predecessor_id IN (
    SELECT t.id FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ));

-- Milestones policies
CREATE POLICY "Users can read milestones in their workspace projects" ON milestones
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage milestones in their workspace projects" ON milestones
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ));

-- Custom fields policies
CREATE POLICY "Users can read custom fields in their workspaces" ON custom_fields
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Workspace admins can manage custom fields" ON custom_fields
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Task custom values policies
CREATE POLICY "Users can read task custom values for accessible tasks" ON task_custom_values
  FOR SELECT TO authenticated
  USING (task_id IN (
    SELECT t.id FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage task custom values for accessible tasks" ON task_custom_values
  FOR ALL TO authenticated
  USING (task_id IN (
    SELECT t.id FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ));

-- Project custom values policies
CREATE POLICY "Users can read project custom values for accessible projects" ON project_custom_values
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage project custom values for accessible projects" ON project_custom_values
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ));

-- Activity logs policies
CREATE POLICY "Users can read activity logs for their workspaces" ON activity_logs
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create activity logs for their workspaces" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

-- Comments policies
CREATE POLICY "Users can read comments for accessible projects/tasks" ON comments
  FOR SELECT TO authenticated
  USING (
    (project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
    )) OR
    (task_id IN (
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create comments for accessible projects/tasks" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      (project_id IN (
        SELECT p.id FROM projects p
        JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
        WHERE wm.user_id = auth.uid()
      )) OR
      (task_id IN (
        SELECT t.id FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
        WHERE wm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

-- File attachments policies
CREATE POLICY "Users can read attachments in their workspaces" ON file_attachments
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can upload attachments to their workspaces" ON file_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Export jobs policies
CREATE POLICY "Users can read own export jobs" ON export_jobs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create export jobs for their workspaces" ON export_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- API keys policies
CREATE POLICY "Users can read API keys for their workspaces" ON api_keys
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Workspace admins can manage API keys" ON api_keys
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Portfolios policies
CREATE POLICY "Users can read portfolios in their workspaces" ON portfolios
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage portfolios in their workspaces" ON portfolios
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ));

-- Portfolio projects policies
CREATE POLICY "Users can read portfolio projects for accessible portfolios" ON portfolio_projects
  FOR SELECT TO authenticated
  USING (portfolio_id IN (
    SELECT pf.id FROM portfolios pf
    JOIN workspace_members wm ON pf.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage portfolio projects for accessible portfolios" ON portfolio_projects
  FOR ALL TO authenticated
  USING (portfolio_id IN (
    SELECT pf.id FROM portfolios pf
    JOIN workspace_members wm ON pf.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ));

-- =============================================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate project progress based on tasks
CREATE OR REPLACE FUNCTION calculate_project_progress()
RETURNS trigger AS $$
DECLARE
  project_id_to_update uuid;
  avg_progress numeric;
BEGIN
  -- Determine which project to update
  IF TG_OP = 'DELETE' THEN
    project_id_to_update := OLD.project_id;
  ELSE
    project_id_to_update := NEW.project_id;
  END IF;

  -- Calculate average progress of all tasks in the project
  SELECT COALESCE(AVG(progress), 0)
  INTO avg_progress
  FROM tasks
  WHERE project_id = project_id_to_update;

  -- Update project progress
  UPDATE projects
  SET progress = ROUND(avg_progress)
  WHERE id = project_id_to_update;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-calculate project progress
CREATE TRIGGER calculate_project_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION calculate_project_progress();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS trigger AS $$
DECLARE
  workspace_id_val uuid;
  project_id_val uuid;
  action_text text;
  entity_type_val text;
BEGIN
  -- Determine workspace and project IDs based on table
  IF TG_TABLE_NAME = 'workspaces' THEN
    workspace_id_val := COALESCE(NEW.id, OLD.id);
    entity_type_val := 'workspace';
  ELSIF TG_TABLE_NAME = 'projects' THEN
    workspace_id_val := COALESCE(NEW.workspace_id, OLD.workspace_id);
    project_id_val := COALESCE(NEW.id, OLD.id);
    entity_type_val := 'project';
  ELSIF TG_TABLE_NAME = 'tasks' THEN
    SELECT p.workspace_id INTO workspace_id_val
    FROM projects p
    WHERE p.id = COALESCE(NEW.project_id, OLD.project_id);
    project_id_val := COALESCE(NEW.project_id, OLD.project_id);
    entity_type_val := 'task';
  ELSIF TG_TABLE_NAME = 'milestones' THEN
    SELECT p.workspace_id INTO workspace_id_val
    FROM projects p
    WHERE p.id = COALESCE(NEW.project_id, OLD.project_id);
    project_id_val := COALESCE(NEW.project_id, OLD.project_id);
    entity_type_val := 'milestone';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Determine action text
  IF TG_OP = 'INSERT' THEN
    action_text := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_text := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_text := 'deleted';
  END IF;

  -- Insert activity log
  INSERT INTO activity_logs (
    workspace_id,
    project_id,
    task_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    workspace_id_val,
    project_id_val,
    CASE WHEN entity_type_val = 'task' THEN COALESCE(NEW.id, OLD.id) ELSE NULL END,
    auth.uid(),
    action_text,
    entity_type_val,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activity logging triggers
CREATE TRIGGER log_workspace_activity
  AFTER INSERT OR UPDATE OR DELETE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_project_activity
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_task_activity
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_milestone_activity
  AFTER INSERT OR UPDATE OR DELETE ON milestones
  FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Function to validate task dependencies (prevent circular dependencies)
CREATE OR REPLACE FUNCTION check_task_dependencies()
RETURNS trigger AS $$
BEGIN
  -- Check for circular dependencies using recursive CTE
  WITH RECURSIVE dependency_chain AS (
    SELECT predecessor_id, successor_id, 1 as depth
    FROM task_dependencies
    WHERE predecessor_id = NEW.successor_id
    
    UNION ALL
    
    SELECT td.predecessor_id, td.successor_id, dc.depth + 1
    FROM task_dependencies td
    JOIN dependency_chain dc ON td.predecessor_id = dc.successor_id
    WHERE dc.depth < 100 -- Prevent infinite recursion
  )
  SELECT 1 FROM dependency_chain
  WHERE successor_id = NEW.predecessor_id
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Circular dependency detected. Cannot create this dependency.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check dependencies
CREATE TRIGGER check_dependencies_trigger
  BEFORE INSERT OR UPDATE ON task_dependencies
  FOR EACH ROW EXECUTE FUNCTION check_task_dependencies();

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Ganty Database Schema has been successfully created/updated!';
  RAISE NOTICE '✅ All tables, indexes, policies, functions, and triggers are in place.';
  RAISE NOTICE '✅ Row Level Security is enabled on all tables.';
  RAISE NOTICE '✅ Your database is ready for production use.';
END $$;
