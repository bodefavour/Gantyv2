/*
  # Create base schema for Ganty project management platform

  1. New Tables
    - `profiles` - User profile information
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `first_name` (text, nullable)
      - `last_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `workspaces` - Team workspaces
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `owner_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `workspace_members` - Workspace membership with roles
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, references workspaces)
      - `user_id` (uuid, references profiles)
      - `role` (enum: owner, admin, member, viewer)
      - `created_at` (timestamp)
    
    - `projects` - Individual projects within workspaces
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, references workspaces)
      - `name` (text)
      - `description` (text, nullable)
      - `start_date` (date)
      - `end_date` (date, nullable)
      - `status` (enum: planning, active, on_hold, completed, cancelled)
      - `progress` (integer, 0-100)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tasks` - Project tasks with hierarchy support
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `parent_id` (uuid, nullable, references tasks)
      - `name` (text)
      - `description` (text, nullable)
      - `start_date` (date)
      - `end_date` (date)
      - `duration` (integer, days)
      - `progress` (integer, 0-100)
      - `status` (enum: not_started, in_progress, completed, on_hold)
      - `priority` (enum: low, medium, high, critical)
      - `assigned_to` (uuid, nullable, references profiles)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for workspace-based access control
    - Add policies for user-specific data access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
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
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to uuid REFERENCES profiles(id),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Workspace policies
CREATE POLICY "Users can read workspaces they belong to"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update their workspaces"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces"
  ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Users can read workspace members for their workspaces"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage members"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Projects policies
CREATE POLICY "Users can read projects in their workspaces"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their workspaces"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update projects in their workspaces"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Tasks policies
CREATE POLICY "Users can read tasks in their workspace projects"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their workspace projects"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update tasks in their workspace projects"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Create a default workspace for the user
  INSERT INTO workspaces (name, owner_id)
  VALUES ('My Workspace', NEW.id);
  
  -- Add user as owner of their default workspace
  INSERT INTO workspace_members (workspace_id, user_id, role)
  SELECT id, NEW.id, 'owner'
  FROM workspaces
  WHERE owner_id = NEW.id
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();