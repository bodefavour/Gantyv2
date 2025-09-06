import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

interface ProjectWithTaskCount extends Project {
  task_count?: number;
  completed_tasks?: number;
}

export function useProjects() {
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<ProjectWithTaskCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!currentWorkspace) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch projects with task counts
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          tasks!left(count),
          completed_tasks:tasks!left(count)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('tasks.status', 'completed')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Get task counts for each project
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count: totalTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { count: completedTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('status', 'completed');

          return {
            ...project,
            task_count: totalTasks || 0,
            completed_tasks: completedTasks || 0,
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (projectData: {
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
    status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    priority?: string;
    color?: string;
  }) => {
    if (!currentWorkspace) throw new Error('No workspace selected');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const insertData: ProjectInsert = {
        ...projectData,
        workspace_id: currentWorkspace.id,
        created_by: user.data.user.id,
        status: projectData.status || 'planning',
        priority: projectData.priority || 'medium',
        color: projectData.color || '#3b82f6',
        progress: 0,
        is_template: false,
        settings: {},
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newProject = { ...data, task_count: 0, completed_tasks: 0 };
      setProjects(prev => [newProject, ...prev]);
      
      // Log activity
      await logActivity('created', 'project', data.id, null, data);
      
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProject = async (id: string, updates: ProjectUpdate) => {
    try {
      const oldProject = projects.find(p => p.id === id);
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...data } : p
      ));

      // Log activity
      await logActivity('updated', 'project', id, oldProject, data);
      
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const project = projects.find(p => p.id === id);
      
      // First check if project has tasks
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

      if (count && count > 0) {
        throw new Error('Cannot delete project with existing tasks');
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      
      // Log activity
      await logActivity('deleted', 'project', id, project, null);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const duplicateProject = async (sourceId: string, newName: string) => {
    try {
      const sourceProject = projects.find(p => p.id === sourceId);
      if (!sourceProject) throw new Error('Source project not found');

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Create new project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: newName,
          description: sourceProject.description,
          workspace_id: sourceProject.workspace_id,
          start_date: sourceProject.start_date,
          end_date: sourceProject.end_date,
          status: 'planning' as const,
          priority: sourceProject.priority,
          color: sourceProject.color,
          created_by: user.data.user.id,
          template_id: sourceId,
          is_template: false,
          settings: sourceProject.settings,
          progress: 0,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Copy tasks
      const { data: sourceTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', sourceId);

      if (sourceTasks && sourceTasks.length > 0) {
        const tasksToInsert = sourceTasks.map(task => ({
          ...task,
          id: undefined,
          project_id: newProject.id,
          created_by: user.data.user.id,
          created_at: undefined,
          updated_at: undefined,
        }));

        await supabase
          .from('tasks')
          .insert(tasksToInsert);
      }

      await fetchProjects(); // Refresh the list
      return newProject;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const archiveProject = async (id: string) => {
    return updateProject(id, { status: 'completed' });
  };

  const getProjectById = (id: string) => {
    return projects.find(p => p.id === id);
  };

  const getProjectsByStatus = (status: Project['status']) => {
    return projects.filter(p => p.status === status);
  };

  // Helper function to log activities
  const logActivity = async (
    action: string,
    entityType: 'project',
    entityId: string,
    oldValues: any,
    newValues: any
  ) => {
    try {
      if (!currentWorkspace) return;
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      await supabase.from('activity_logs').insert({
        workspace_id: currentWorkspace.id,
        user_id: user.data.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        project_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        metadata: {},
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    archiveProject,
    getProjectById,
    getProjectsByStatus,
  };
}