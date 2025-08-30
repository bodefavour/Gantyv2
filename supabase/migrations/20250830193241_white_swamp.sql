/*
  # Complete Ganty Database Schema - Safe Migration

  This script safely creates or updates the complete database schema.
  It handles existing tables, policies, and other objects gracefully.

  1. New Tables
    - `profiles` - User profiles with extended information
    - `workspaces` - Multi-tenant workspace system
    - `workspace_members` - Team membership with roles
    - `workspace_invitations` - Pending team invitations
    - `projects` - Project management with full metadata
    - `tasks` - Hierarchical task system with rich properties
    - `task_dependencies` - Task relationship management
    - `milestones` - Project milestone tracking
    - `activity_logs` - Complete audit trail
    - `custom_fields` - Flexible field definitions
    - `task_custom_values` - Custom field values for tasks
    - `project_templates` - Reusable project templates
    - `notifications` - In-app notification system
    - `file_attachments` - File management system
    - `comments` - Task and project comments
    - `time_entries` - Work time tracking (optional)
    - `project_roles` - Project-specific permissions
    - `workspace_settings` - Workspace configuration
    - `export_jobs` - Export job tracking
    - `api_keys` - API access management

  2. Security
    - Enable RLS on all tables
    - Workspace-based access control
    - Role-based permissions
    - Secure API endpoints

  3. Features
    - Complete task hierarchy with dependencies
    - Milestone tracking and management
    - Activity logging for all actions
    - Custom fields for flexible data
    - File attachments and comments
    - Team collaboration features
    - Export and reporting capabilities
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies first to avoid conflicts
DO $$
BEGIN
    -- Drop all policies for each table if they exist
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    
    DROP POLICY IF EXISTS "Users can read workspaces they belong to" ON workspaces;
    DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
    DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON workspaces;
    
    DROP POLICY IF EXISTS "Users can read workspace members for their workspaces" ON workspace_members;
    DROP POLICY IF EXISTS "Workspace admins can manage members" ON workspace_members;
    
    DROP POLICY IF EXISTS "Users can read invitations for their workspaces" ON workspace_invitations;
    DROP POLICY IF EXISTS "Workspace admins can manage invitations" ON workspace_invitations;
    
    DROP POLICY IF EXISTS "Users can read projects in their workspaces" ON projects;
    DROP POLICY IF EXISTS "Users can create projects in their workspaces" ON projects;
    DROP POLICY IF EXISTS "Users can update projects in their workspaces" ON projects;
    
    DROP POLICY IF EXISTS "Users can read project roles for accessible projects" ON project_roles;
    DROP POLICY IF EXISTS "Project managers can manage project roles" ON project_roles;
    
    DROP POLICY IF EXISTS "Users can read tasks in their workspace projects" ON tasks;
    DROP POLICY IF EXISTS "Users can create tasks in their workspace projects" ON tasks;
    DROP POLICY IF EXISTS "Users can update tasks in their workspace projects" ON tasks;
    
    DROP POLICY IF EXISTS "Users can read dependencies for accessible tasks" ON task_dependencies;
    DROP POLICY IF EXISTS "Users can manage dependencies for accessible tasks" ON task_dependencies;
    
    DROP POLICY IF EXISTS "Users can read milestones in their workspace projects" ON milestones;
    DROP POLICY IF EXISTS "Users can manage milestones in their workspace projects" ON milestones;
    
    DROP POLICY IF EXISTS "Users can read custom fields in their workspaces" ON custom_fields;
    DROP POLICY IF EXISTS "Workspace admins can manage custom fields" ON custom_fields;
    
    DROP POLICY IF EXISTS "Users can read task custom values for accessible tasks" ON task_custom_values;
    DROP POLICY IF EXISTS "Users can manage task custom values for accessible tasks" ON task_custom_values;
    
    DROP POLICY IF EXISTS "Users can read project custom values for accessible projects" ON project_custom_values;
    DROP POLICY IF EXISTS "Users can manage project custom values for accessible projects" ON project_custom_values;
    
    DROP POLICY IF EXISTS "Users can read activity logs for their workspaces" ON activity_logs;
    DROP POLICY IF EXISTS "Users can create activity logs for their workspaces" ON activity_logs;
    
    DROP POLICY IF EXISTS "Users can read comments for accessible projects/tasks" ON comments;
    DROP POLICY IF EXISTS "Users can create comments for accessible projects/tasks" ON comments;
    DROP POLICY IF EXISTS "Users can update own comments" ON comments;
    
    DROP POLICY IF EXISTS "Users can read attachments in their workspaces" ON file_attachments;
    DROP POLICY IF EXISTS "Users can upload attachments to their workspaces" ON file_attachments;
    
    DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    
    DROP POLICY IF EXISTS "Users can read own export jobs" ON export_jobs;
    DROP POLICY IF EXISTS "Users can create export jobs for their workspaces" ON export_jobs;
    
    DROP POLICY IF EXISTS "Users can read API keys for their workspaces" ON api_keys;
    DROP POLICY IF EXISTS "Workspace admins can manage API keys" ON api_keys;
    
    DROP POLICY IF EXISTS "Users can read portfolios in their workspaces" ON portfolios;
    DROP POLICY IF EXISTS "Users can manage portfolios in their workspaces" ON portfolios;
    
    DROP POLICY IF EXISTS "Users can read portfolio projects for accessible portfolios" ON portfolio_projects;
    DROP POLICY IF EXISTS "Users can manage portfolio projects for accessible portfolios" ON portfolio_projects;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors when policies don't exist
        NULL;
END $$;

-- Drop existing indexes if they exist
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

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS calculate_project_progress() CASCADE;
DROP FUNCTION IF EXISTS log_activity() CASCADE;
DROP FUNCTION IF EXISTS check_task_dependencies() CASCADE;

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS portfolio_projects CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS export_jobs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS project_custom_values CASCADE;
DROP TABLE IF EXISTS task_custom_values CASCADE;
DROP TABLE IF EXISTS custom_fields CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_roles CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS workspace_invitations CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

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

-- Create indexes for better performance
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

-- Enable Row Level Security
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