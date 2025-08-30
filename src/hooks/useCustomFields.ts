import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

type CustomField = Database['public']['Tables']['custom_fields']['Row'];
type CustomFieldInsert = Database['public']['Tables']['custom_fields']['Insert'];

export function useCustomFields(workspaceId?: string) {
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCustomFields = async () => {
        if (!workspaceId) {
            setCustomFields([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('custom_fields')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at');

            if (error) throw error;
            setCustomFields(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setCustomFields([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomFields();
    }, [workspaceId]);

    const createCustomField = async (fieldData: Omit<CustomFieldInsert, 'workspace_id'>) => {
        if (!workspaceId) throw new Error('No workspace selected');

        const { data, error } = await (supabase as any)
            .from('custom_fields')
            .insert({
                ...fieldData,
                workspace_id: workspaceId,
            })
            .select()
            .single();

        if (error) throw error;

        setCustomFields(prev => [...prev, data]);
        toast.success('Custom field created successfully!');
        return data;
    };

    const updateCustomField = async (id: string, updates: Partial<CustomField>) => {
        const { data, error } = await (supabase as any)
            .from('custom_fields')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        setCustomFields(prev => prev.map(f =>
            f.id === id ? { ...f, ...data } as CustomField : f
        ));

        toast.success('Custom field updated successfully!');
        return data;
    };

    const deleteCustomField = async (id: string) => {
        const { error } = await (supabase as any)
            .from('custom_fields')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setCustomFields(prev => prev.filter(f => f.id !== id));
        toast.success('Custom field deleted successfully!');
    };

    return {
        customFields,
        loading,
        error,
        fetchCustomFields,
        createCustomField,
        updateCustomField,
        deleteCustomField,
    };
}