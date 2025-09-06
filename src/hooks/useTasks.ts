import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

interface TaskWithDetails extends Task {
  assignee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  project?: {
    id: string;
    name: string;
    workspace_id: string;
  };
  subtasks?: Task[];
  dependencies?: {
    predecessors: Task[];
    successors: Task[];
  };
}

export function useTasks(projectId?: string) {
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch tasks with related data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tasksData, error: tasksError } = await (supabase as any)
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assigned_to_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          project:projects!tasks_project_id_fkey (
            id,
            name,
            workspace_id
          )
        `)
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Organize tasks with hierarchy (parent-child relationships)
      const taskMap = new Map();
      const rootTasks: TaskWithDetails[] = [];

      // First pass: create all tasks and map them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tasksData || []).forEach((task: any) => {
        const taskWithDetails: TaskWithDetails = {
          ...task,
          subtasks: [],
        };
        taskMap.set(task.id, taskWithDetails);
      });

      // Second pass: organize hierarchy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tasksData || []).forEach((task: any) => {
        const taskWithDetails = taskMap.get(task.id);
        if (task.parent_id) {
          const parent = taskMap.get(task.parent_id);
          if (parent) {
            parent.subtasks = parent.subtasks || [];
            parent.subtasks.push(taskWithDetails);
          }
        } else {
          rootTasks.push(taskWithDetails);
        }
      });

      // Fetch dependencies for each task
      const tasksWithDependencies = await Promise.all(
        rootTasks.map(async (task) => {
          const dependencies = await fetchTaskDependencies(task.id);
          return { ...task, dependencies };
        })
      );

      setTasks(tasksWithDependencies);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchTaskDependencies = async (taskId: string) => {
    try {
      // Get predecessors (tasks this task depends on)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: predecessorData } = await (supabase as any)
        .from('task_dependencies')
        .select(`
          predecessor_id,
          type,
          lag,
          predecessor:tasks!task_dependencies_predecessor_id_fkey (*)
        `)
        .eq('successor_id', taskId);

      // Get successors (tasks that depend on this task)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: successorData } = await (supabase as any)
        .from('task_dependencies')
        .select(`
          successor_id,
          type,
          lag,
          successor:tasks!task_dependencies_successor_id_fkey (*)
        `)
        .eq('predecessor_id', taskId);

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        predecessors: predecessorData?.map((d: any) => d.predecessor) || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        successors: successorData?.map((d: any) => d.successor) || [],
      };
    } catch (error) {
      console.error('Error fetching task dependencies:', error);
      return { predecessors: [], successors: [] };
    }
  };

  const createTask = async (taskData: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    parent_id?: string;
    assigned_to?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
    estimated_hours?: number;
    is_milestone?: boolean;
    color?: string;
  }) => {
    if (!projectId) throw new Error('No project selected');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Calculate duration in days
      const startDate = new Date(taskData.start_date);
      const endDate = new Date(taskData.end_date);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get the next sort order
      const { data: lastTask } = await supabase
        .from('tasks')
        .select('sort_order')
        .eq('project_id', projectId)
        .eq('parent_id', taskData.parent_id || null)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const sortOrder = (lastTask?.sort_order || 0) + 1;

      const insertData: TaskInsert = {
        ...taskData,
        project_id: projectId,
        created_by: user.data.user.id,
        duration,
        progress: 0,
        status: taskData.status || 'not_started',
        priority: taskData.priority || 'medium',
        color: taskData.color || '#3b82f6',
        sort_order: sortOrder,
        actual_hours: 0,
        is_milestone: taskData.is_milestone || false,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select(`
          *,
          assignee:profiles!tasks_assigned_to_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update project progress
      await updateProjectProgress(projectId);

      // Add to local state
      const newTask: TaskWithDetails = { ...data, subtasks: [] };
      setTasks(prev => [...prev, newTask]);

      // Log activity
      await logActivity('created', 'task', data.id, null, data);

      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTask = async (id: string, updates: TaskUpdate) => {
    try {
      const oldTask = tasks.find(t => t.id === id);

      // Calculate duration if dates are being updated
      let duration: number | undefined;
      if (updates.start_date || updates.end_date) {
        const task = tasks.find(t => t.id === id);
        const startDate = new Date(updates.start_date || task?.start_date || '');
        const endDate = new Date(updates.end_date || task?.end_date || '');
        duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          duration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          assignee:profiles!tasks_assigned_to_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update project progress if task status changed
      if (updates.status || updates.progress !== undefined) {
        await updateProjectProgress(projectId!);
      }

      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, ...data } : t
      ));

      // Log activity
      await logActivity('updated', 'task', id, oldTask, data);

      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);

      // Check for dependencies
      const { data: dependencies } = await supabase
        .from('task_dependencies')
        .select('*')
        .or(`predecessor_id.eq.${id},successor_id.eq.${id}`);

      if (dependencies && dependencies.length > 0) {
        throw new Error('Cannot delete task with dependencies. Remove dependencies first.');
      }

      // Check for subtasks
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', id);

      if (count && count > 0) {
        throw new Error('Cannot delete task with subtasks. Delete subtasks first.');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update project progress
      await updateProjectProgress(projectId!);

      setTasks(prev => prev.filter(t => t.id !== id));

      // Log activity
      await logActivity('deleted', 'task', id, task, null);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const duplicateTask = async (sourceId: string) => {
    try {
      const sourceTask = tasks.find(t => t.id === sourceId);
      if (!sourceTask) throw new Error('Source task not found');

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const insertData: TaskInsert = {
        project_id: sourceTask.project_id,
        parent_id: sourceTask.parent_id,
        name: `${sourceTask.name} (Copy)`,
        description: sourceTask.description,
        start_date: sourceTask.start_date,
        end_date: sourceTask.end_date,
        duration: sourceTask.duration,
        progress: 0,
        status: 'not_started',
        priority: sourceTask.priority,
        assigned_to: sourceTask.assigned_to,
        estimated_hours: sourceTask.estimated_hours,
        actual_hours: 0,
        color: sourceTask.color,
        is_milestone: sourceTask.is_milestone,
        sort_order: sourceTask.sort_order + 1,
        created_by: user.data.user.id,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await fetchTasks(); // Refresh the list
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const reorderTasks = async (taskIds: string[], newOrders: number[]) => {
    try {
      const updates = taskIds.map((id, index) => ({
        id,
        sort_order: newOrders[index],
      }));

      const { error } = await supabase
        .from('tasks')
        .upsert(updates);

      if (error) throw error;

      await fetchTasks(); // Refresh to get new order
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder tasks';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addDependency = async (predecessorId: string, successorId: string, type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish' = 'finish_to_start', lag: number = 0) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .insert({
          predecessor_id: predecessorId,
          successor_id: successorId,
          type,
          lag,
        });

      if (error) throw error;

      await fetchTasks(); // Refresh to update dependencies
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add dependency';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeDependency = async (predecessorId: string, successorId: string) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('predecessor_id', predecessorId)
        .eq('successor_id', successorId);

      if (error) throw error;

      await fetchTasks(); // Refresh to update dependencies
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove dependency';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Helper function to update project progress
  const updateProjectProgress = async (projectId: string) => {
    try {
      const { data: projectTasks } = await supabase
        .from('tasks')
        .select('progress')
        .eq('project_id', projectId);

      if (projectTasks && projectTasks.length > 0) {
        const totalProgress = projectTasks.reduce((sum, task) => sum + task.progress, 0);
        const averageProgress = Math.round(totalProgress / projectTasks.length);

        await supabase
          .from('projects')
          .update({ progress: averageProgress })
          .eq('id', projectId);
      }
    } catch (error) {
      console.error('Failed to update project progress:', error);
    }
  };

  // Helper function to log activities
  const logActivity = async (
    action: string,
    entityType: 'task',
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
        project_id: projectId || null,
        task_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        metadata: {},
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const getTaskById = (id: string): TaskWithDetails | undefined => {
    const findInTasks = (taskList: TaskWithDetails[]): TaskWithDetails | undefined => {
      for (const task of taskList) {
        if (task.id === id) return task;
        if (task.subtasks) {
          const found = findInTasks(task.subtasks);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findInTasks(tasks);
  };

  const getTasksByStatus = (status: Task['status']) => {
    const filterByStatus = (taskList: TaskWithDetails[]): TaskWithDetails[] => {
      const result: TaskWithDetails[] = [];
      for (const task of taskList) {
        if (task.status === status) result.push(task);
        if (task.subtasks) {
          result.push(...filterByStatus(task.subtasks));
        }
      }
      return result;
    };
    return filterByStatus(tasks);
  };

  const getTasksByAssignee = (userId: string) => {
    const filterByAssignee = (taskList: TaskWithDetails[]): TaskWithDetails[] => {
      const result: TaskWithDetails[] = [];
      for (const task of taskList) {
        if (task.assigned_to === userId) result.push(task);
        if (task.subtasks) {
          result.push(...filterByAssignee(task.subtasks));
        }
      }
      return result;
    };
    return filterByAssignee(tasks);
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    reorderTasks,
    addDependency,
    removeDependency,
    getTaskById,
    getTasksByStatus,
    getTasksByAssignee,
  };
}