import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface Project {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    progress: number;
    created_at: string;
}

export function useProjects() {
    const { currentWorkspace } = useWorkspace();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = async () => {
        if (!currentWorkspace) {
            setProjects([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('workspace_id', currentWorkspace.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [currentWorkspace]);

    const createProject = async (projectData: {
        name: string;
        description?: string;
        start_date: string;
        end_date?: string;
    }) => {
        if (!currentWorkspace) throw new Error('No workspace selected');

        const { data, error } = await (supabase as any)
            .from('projects')
            .insert({
                ...projectData,
                workspace_id: currentWorkspace.id,
                created_by: (await supabase.auth.getUser()).data.user?.id || '',
            })
            .select()
            .single();

        if (error) throw error;

        setProjects(prev => [data, ...prev]);
        return data;
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        const { data, error } = await (supabase as any)
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } as Project : p));
        return data;
    };

    const deleteProject = async (id: string) => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setProjects(prev => prev.filter(p => p.id !== id));
    };

    return {
        projects,
        loading,
        error,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
    };
}