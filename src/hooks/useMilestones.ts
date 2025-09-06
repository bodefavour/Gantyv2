import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

type Milestone = Database['public']['Tables']['milestones']['Row'];
type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];

interface MilestoneWithDetails extends Milestone {
  project?: {
    id: string;
    name: string;
    workspace_id: string;
  };
  creator?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  tasks_count?: number;
  completed_tasks_count?: number;
}

export function useMilestones(projectId?: string) {
  const { currentWorkspace } = useWorkspace();
  const [milestones, setMilestones] = useState<MilestoneWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    if (!projectId && !currentWorkspace) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('milestones')
        .select(`
          *,
          project:projects!milestones_project_id_fkey (
            id,
            name,
            workspace_id
          ),
          creator:profiles!milestones_created_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (currentWorkspace) {
        // Get milestones for all projects in the workspace
        const { data: workspaceProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('workspace_id', currentWorkspace.id);

        if (workspaceProjects && workspaceProjects.length > 0) {
          const projectIds = (workspaceProjects as any[]).map(p => p.id);
          query = query.in('project_id', projectIds);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: milestonesData, error: milestonesError } = await (query as any);

      if (milestonesError) throw milestonesError;

      // Get task counts for each milestone
      const milestonesWithCounts = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (milestonesData || []).map(async (milestone: any) => {
          // Get tasks that are due on or before this milestone
          const { count: totalTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', milestone.project_id)
            .lte('end_date', milestone.due_date);

          const { count: completedTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', milestone.project_id)
            .eq('status', 'completed')
            .lte('end_date', milestone.due_date);

          return {
            ...milestone,
            tasks_count: totalTasks || 0,
            completed_tasks_count: completedTasks || 0,
          };
        })
      );

      setMilestones(milestonesWithCounts);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch milestones';
      setError(errorMessage);
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, currentWorkspace]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const createMilestone = async (milestoneData: {
    project_id: string;
    name: string;
    description?: string;
    due_date: string;
    color?: string;
  }) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const insertData: MilestoneInsert = {
        ...milestoneData,
        created_by: user.data.user.id,
        status: 'pending',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('milestones')
        .insert(insertData)
        .select(`
          *,
          project:projects!milestones_project_id_fkey (
            id,
            name,
            workspace_id
          ),
          creator:profiles!milestones_created_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      const newMilestone = { ...data, tasks_count: 0, completed_tasks_count: 0 };
      setMilestones(prev => [...prev, newMilestone].sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ));

      // Log activity
      await logActivity('created', 'milestone', data.id, null, data);

      toast.success('Milestone created successfully!');
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create milestone';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateMilestone = async (id: string, updates: MilestoneUpdate) => {
    try {
      const oldMilestone = milestones.find(m => m.id === id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('milestones')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          project:projects!milestones_project_id_fkey (
            id,
            name,
            workspace_id
          ),
          creator:profiles!milestones_created_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      setMilestones(prev => prev.map(m => 
        m.id === id ? { ...m, ...data } : m
      ).sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ));

      // Log activity
      await logActivity('updated', 'milestone', id, oldMilestone, data);

      toast.success('Milestone updated successfully!');
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update milestone';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const milestone = milestones.find(m => m.id === id);

      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMilestones(prev => prev.filter(m => m.id !== id));

      // Log activity
      await logActivity('deleted', 'milestone', id, milestone, null);

      toast.success('Milestone deleted successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete milestone';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const markMilestoneComplete = async (id: string) => {
    return updateMilestone(id, { status: 'completed' });
  };

  const markMilestoneIncomplete = async (id: string) => {
    return updateMilestone(id, { status: 'pending' });
  };

  const getMilestonesByStatus = (status: Milestone['status']) => {
    return milestones.filter(m => m.status === status);
  };

  const getUpcomingMilestones = (days: number = 7) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return milestones.filter(m => {
      const dueDate = new Date(m.due_date);
      return dueDate >= today && dueDate <= futureDate && m.status !== 'completed';
    });
  };

  const getOverdueMilestones = () => {
    const today = new Date();
    return milestones.filter(m => {
      const dueDate = new Date(m.due_date);
      return dueDate < today && m.status !== 'completed';
    });
  };

  // Helper function to log activities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logActivity = async (
    action: string,
    entityType: 'milestone',
    entityId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldValues: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValues: any
  ) => {
    try {
      if (!currentWorkspace) return;
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('activity_logs').insert({
        workspace_id: currentWorkspace.id,
        user_id: user.data.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        project_id: newValues?.project_id || oldValues?.project_id || null,
        old_values: oldValues,
        new_values: newValues,
        metadata: {},
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return {
    milestones,
    loading,
    error,
    fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    markMilestoneComplete,
    markMilestoneIncomplete,
    getMilestonesByStatus,
    getUpcomingMilestones,
    getOverdueMilestones,
  };
}