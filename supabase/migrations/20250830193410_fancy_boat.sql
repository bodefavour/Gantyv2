/*
  # Database Functions and Triggers

  1. Functions
    - `handle_new_user()` - Create profile on user signup
    - `update_updated_at()` - Auto-update timestamps
    - `calculate_project_progress()` - Auto-calculate project progress
    - `log_activity()` - Log user activities
    - `check_task_dependencies()` - Validate task dependencies

  2. Triggers
    - Auto-update timestamps on record changes
    - Auto-calculate project progress when tasks change
    - Log activities for important actions
    - Validate task dependencies
*/

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
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
DROP TRIGGER IF EXISTS calculate_project_progress_trigger ON tasks;
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
DROP TRIGGER IF EXISTS log_workspace_activity ON workspaces;
CREATE TRIGGER log_workspace_activity
  AFTER INSERT OR UPDATE OR DELETE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_project_activity ON projects;
CREATE TRIGGER log_project_activity
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_task_activity ON tasks;
CREATE TRIGGER log_task_activity
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_milestone_activity ON milestones;
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
DROP TRIGGER IF EXISTS check_dependencies_trigger ON task_dependencies;
CREATE TRIGGER check_dependencies_trigger
  BEFORE INSERT OR UPDATE ON task_dependencies
  FOR EACH ROW EXECUTE FUNCTION check_task_dependencies();