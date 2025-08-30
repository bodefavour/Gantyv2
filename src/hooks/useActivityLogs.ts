import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ActivityLogWithDetails } from '../lib/database.types';

export function useActivityLogs(workspaceId?: string, projectId?: string) {
    const [activities, setActivities] = useState<ActivityLogWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = async () => {
        if (!workspaceId) {
            setActivities([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let query = supabase
                .from('activity_logs')
                .select(`
          *,
          user:profiles!activity_logs_user_id_fkey (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setActivities(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [workspaceId, projectId]);

    const logActivity = async (activityData: {
        action: string;
        entity_type: 'workspace' | 'project' | 'task' | 'milestone' | 'member';
        entity_id?: string;
        project_id?: string;
        task_id?: string;
        old_values?: any;
        new_values?: any;
        metadata?: any;
    }) => {
        if (!workspaceId) throw new Error('No workspace selected');

        const { error } = await (supabase as any)
            .from('activity_logs')
            .insert({
                workspace_id: workspaceId,
                user_id: (await supabase.auth.getUser()).data.user?.id || '',
                ...activityData,
            });

        if (error) throw error;

        // Refresh activities
        fetchActivities();
    };

    return {
        activities,
        loading,
        error,
        fetchActivities,
        logActivity,
    };
}