import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

interface ActivityLogWithDetails extends ActivityLog {
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  formatted_description?: string;
}

interface ActivityFilters {
  user_id?: string;
  action?: string;
  entity_type?: string;
  project_id?: string;
  task_id?: string;
  date_from?: string;
  date_to?: string;
}

interface ActivityStats {
  total_activities: number;
  activities_today: number;
  activities_this_week: number;
  most_active_user?: {
    id: string;
    name: string;
    count: number;
  };
  most_common_action?: {
    action: string;
    count: number;
  };
}

export function useActivityLogs(filters?: ActivityFilters) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [activities, setActivities] = useState<ActivityLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchActivities = useCallback(async (reset = false) => {
    if (!currentWorkspace) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      if (reset) {
        setOffset(0);
        setHasMore(true);
      }
      
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const limit = 50;

      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          user:profiles!activity_logs_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          project:projects (
            id,
            name
          ),
          task:tasks (
            id,
            title
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      // Apply filters
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters?.task_id) {
        query = query.eq('task_id', filters.task_id);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (query as any);
      if (fetchError) throw fetchError;

      // Format activity descriptions
      const formattedActivities = (data || []).map(formatActivityDescription);

      if (reset) {
        setActivities(formattedActivities);
      } else {
        setActivities(prev => [...prev, ...formattedActivities]);
      }

      setHasMore(data?.length === limit);
      setOffset(currentOffset + limit);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, filters, offset]);

  useEffect(() => {
    fetchActivities(true);
  }, [currentWorkspace, filters]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchActivities(false);
    }
  };

  const logActivity = async (activityData: {
    action: string;
    entity_type: 'workspace' | 'project' | 'task' | 'milestone' | 'member';
    entity_id?: string;
    project_id?: string;
    task_id?: string;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      if (!currentWorkspace || !user) return;

      const insertData: ActivityLogInsert = {
        workspace_id: currentWorkspace.id,
        user_id: user.id,
        action: activityData.action,
        entity_type: activityData.entity_type,
        entity_id: activityData.entity_id || null,
        project_id: activityData.project_id || null,
        task_id: activityData.task_id || null,
        old_values: activityData.old_values || null,
        new_values: activityData.new_values || null,
        metadata: activityData.metadata || {},
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('activity_logs')
        .insert(insertData);

      if (error) throw error;

      // Refresh activities to show the new one
      await fetchActivities(true);
    } catch (err: unknown) {
      console.error('Failed to log activity:', err);
    }
  };

  const getActivityStats = async (): Promise<ActivityStats | null> => {
    try {
      if (!currentWorkspace) return null;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get total count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: totalCount } = await (supabase as any)
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id);

      // Get today's count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: todayCount } = await (supabase as any)
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id)
        .gte('created_at', today);

      // Get this week's count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: weekCount } = await (supabase as any)
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id)
        .gte('created_at', weekAgo);

      // Get most active user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userStats } = await (supabase as any)
        .from('activity_logs')
        .select(`
          user_id,
          profiles!activity_logs_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .gte('created_at', weekAgo);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userCounts = (userStats || []).reduce((acc: Record<string, any>, log: any) => {
        const userId = log.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            id: userId,
            name: `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim() || 'Unknown User',
            count: 0,
          };
        }
        acc[userId].count++;
        return acc;
      }, {});

      const mostActiveUser = Object.values(userCounts).sort((a: any, b: any) => b.count - a.count)[0] as any;

      // Get most common action
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: actionStats } = await (supabase as any)
        .from('activity_logs')
        .select('action')
        .eq('workspace_id', currentWorkspace.id)
        .gte('created_at', weekAgo);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actionCounts = (actionStats || []).reduce((acc: Record<string, number>, log: any) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      const mostCommonAction = Object.entries(actionCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

      return {
        total_activities: totalCount || 0,
        activities_today: todayCount || 0,
        activities_this_week: weekCount || 0,
        most_active_user: mostActiveUser || undefined,
        most_common_action: mostCommonAction ? {
          action: mostCommonAction[0],
          count: mostCommonAction[1] as number,
        } : undefined,
      };
    } catch (err: unknown) {
      console.error('Failed to get activity stats:', err);
      return null;
    }
  };

  const clearActivities = async (olderThanDays = 30) => {
    try {
      if (!currentWorkspace) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('workspace_id', currentWorkspace.id)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      // Refresh activities
      await fetchActivities(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear activities';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const exportActivities = async (format: 'json' | 'csv' = 'json') => {
    try {
      if (!currentWorkspace) throw new Error('No workspace selected');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('activity_logs')
        .select(`
          *,
          user:profiles!activity_logs_user_id_fkey (
            first_name,
            last_name,
            email
          ),
          project:projects (
            name
          ),
          task:tasks (
            title
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activities-${currentWorkspace.name}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Convert to CSV
        const headers = ['Date', 'User', 'Action', 'Entity Type', 'Project', 'Task', 'Description'];
        const csvData = [
          headers.join(','),
          ...data.map((activity: any) => [
            new Date(activity.created_at).toLocaleString(),
            `${activity.user?.first_name || ''} ${activity.user?.last_name || ''}`.trim(),
            activity.action,
            activity.entity_type,
            activity.project?.name || '',
            activity.task?.title || '',
            formatActivityDescription(activity).formatted_description || '',
          ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activities-${currentWorkspace.name}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export activities';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Helper function to format activity descriptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatActivityDescription = (activity: any): ActivityLogWithDetails => {
    const userName = `${activity.user?.first_name || ''} ${activity.user?.last_name || ''}`.trim() || 'Someone';
    let description = '';

    switch (activity.action) {
      case 'created':
        description = `${userName} created ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      case 'updated':
        description = `${userName} updated ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      case 'deleted':
        description = `${userName} deleted ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      case 'assigned':
        description = `${userName} assigned ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      case 'completed':
        description = `${userName} completed ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      case 'commented':
        description = `${userName} commented on ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      case 'archived':
        description = `${userName} archived ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      case 'restored':
        description = `${userName} restored ${activity.entity_type} ${getEntityName(activity)}`;
        break;
      default:
        description = `${userName} performed ${activity.action} on ${activity.entity_type}`;
    }

    return {
      ...activity,
      formatted_description: description,
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getEntityName = (activity: any): string => {
    if (activity.project?.name) return activity.project.name;
    if (activity.task?.title) return activity.task.title;
    if (activity.new_values?.name) return activity.new_values.name;
    if (activity.new_values?.title) return activity.new_values.title;
    if (activity.old_values?.name) return activity.old_values.name;
    if (activity.old_values?.title) return activity.old_values.title;
    return activity.entity_id || 'Unknown';
  };

  const getUniqueUsers = () => {
    const users = new Map();
    activities.forEach(activity => {
      if (activity.user) {
        users.set(activity.user.id, activity.user);
      }
    });
    return Array.from(users.values());
  };

  const getUniqueActions = () => {
    return [...new Set(activities.map(activity => activity.action))];
  };

  const getUniqueEntityTypes = () => {
    return [...new Set(activities.map(activity => activity.entity_type))];
  };

  return {
    activities,
    loading,
    error,
    hasMore,
    fetchActivities,
    loadMore,
    logActivity,
    getActivityStats,
    clearActivities,
    exportActivities,
    getUniqueUsers,
    getUniqueActions,
    getUniqueEntityTypes,
  };
}