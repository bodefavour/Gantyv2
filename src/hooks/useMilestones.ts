import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

type Milestone = Database['public']['Tables']['milestones']['Row'];
type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];

export function useMilestones(projectId?: string) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMilestones = async () => {
        if (!projectId) {
            setMilestones([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('milestones')
                .select('*')
                .eq('project_id', projectId)
                .order('due_date');

            if (error) throw error;
            setMilestones(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setMilestones([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMilestones();
    }, [projectId]);

    const createMilestone = async (milestoneData: Omit<MilestoneInsert, 'created_by'>) => {
        if (!projectId) throw new Error('No project selected');

        const { data, error } = await (supabase as any)
            .from('milestones')
            .insert({
                ...milestoneData,
                project_id: projectId,
                created_by: (await supabase.auth.getUser()).data.user?.id || '',
            })
            .select()
            .single();

        if (error) throw error;

        setMilestones(prev => [...prev, data].sort((a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        ));

        toast.success('Milestone created successfully!');
        return data;
    };

    const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
        const { data, error } = await (supabase as any)
            .from('milestones')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        setMilestones(prev => prev.map(m =>
            m.id === id ? { ...m, ...data } : m
        ));

        toast.success('Milestone updated successfully!');
        return data;
    };

    const deleteMilestone = async (id: string) => {
        const { error } = await supabase
            .from('milestones')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setMilestones(prev => prev.filter(m => m.id !== id));
        toast.success('Milestone deleted successfully!');
    };

    return {
        milestones,
        loading,
        error,
        fetchMilestones,
        createMilestone,
        updateMilestone,
        deleteMilestone,
    };
}