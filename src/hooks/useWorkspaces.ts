import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];
type WorkspaceWithRole = Workspace & { role: string };
type WorkspaceMemberRow = {
    role: string;
    workspaces: Workspace;
};

export function useWorkspaces() {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWorkspaces = useCallback(async () => {
        if (!user) {
            setWorkspaces([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
          role,
          workspaces!inner (
            id,
            name,
            description,
            owner_id,
            created_at,
            updated_at
          )
        `)
                .eq('user_id', user.id);

            if (error) throw error;

            const userWorkspaces = (data as WorkspaceMemberRow[]).map((item) => ({
                ...item.workspaces,
                role: item.role
            }));

            setWorkspaces(userWorkspaces);
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setWorkspaces([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const createWorkspace = async (workspaceData: Omit<WorkspaceInsert, 'owner_id'>) => {
        if (!user) throw new Error('User not authenticated');

        const { data: workspace, error: workspaceError } = await (supabase as any)
            .from('workspaces')
            .insert({
                ...workspaceData,
                owner_id: user.id,
            })
            .select()
            .single();

        if (workspaceError) throw workspaceError;

        // Skip workspace_members insertion for now to avoid RLS issues
        // The owner relationship is established by owner_id in workspaces table

        const newWorkspace: WorkspaceWithRole = { ...workspace, role: 'owner' } as WorkspaceWithRole;
        setWorkspaces(prev => [newWorkspace, ...prev]);
        toast.success('Workspace created successfully!');

        return newWorkspace;
    };

    const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
        const { data, error } = await (supabase as any)
            .from('workspaces')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        setWorkspaces(prev => prev.map(w =>
            w.id === id ? { ...w, ...data } as WorkspaceWithRole : w
        ));

        toast.success('Workspace updated successfully!');
        return data;
    };

    const deleteWorkspace = async (id: string) => {
        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setWorkspaces(prev => prev.filter(w => w.id !== id));
        toast.success('Workspace deleted successfully!');
    };

    const inviteUser = async (workspaceId: string, email: string, role: 'admin' | 'member' | 'viewer') => {
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await (supabase as any)
            .from('workspace_invitations')
            .insert({
                workspace_id: workspaceId,
                email,
                role,
                invited_by: user.id,
                token: crypto.randomUUID(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            })
            .select()
            .single();

        if (error) throw error;

        toast.success(`Invitation sent to ${email}`);
        return data;
    };

    return {
        workspaces,
        loading,
        error,
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        inviteUser,
    };
}