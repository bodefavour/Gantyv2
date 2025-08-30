import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type ExportJob = Database['public']['Tables']['export_jobs']['Row'];
type ExportType = 'pdf' | 'excel' | 'csv' | 'png' | 'svg';

export function useExport() {
    const { user } = useAuth();
    const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
    const [loading, setLoading] = useState(false);

    const createExportJob = async (
        workspaceId: string,
        exportType: ExportType,
        projectId?: string
    ) => {
        if (!user) throw new Error('User not authenticated');

        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('export_jobs')
                .insert({
                    workspace_id: workspaceId,
                    project_id: projectId,
                    user_id: user.id,
                    export_type: exportType,
                })
                .select()
                .single();

            if (error) throw error;

            setExportJobs(prev => [data, ...prev]);
            toast.success(`${exportType.toUpperCase()} export started. You'll be notified when it's ready.`);

            // In a real implementation, this would trigger a background job
            // For now, we'll simulate the export process
            setTimeout(async () => {
                await (supabase as any)
                    .from('export_jobs')
                    .update({
                        status: 'completed',
                        file_url: `https://example.com/exports/${data.id}.${exportType}`,
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', data.id);

                toast.success(`${exportType.toUpperCase()} export completed!`);
            }, 3000);

            return data;
        } catch (err: any) {
            toast.error(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fetchExportJobs = async (workspaceId: string) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('export_jobs')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setExportJobs(data || []);
        } catch (err: any) {
            console.error('Error fetching export jobs:', err);
        }
    };

    return {
        exportJobs,
        loading,
        createExportJob,
        fetchExportJobs,
    };
}