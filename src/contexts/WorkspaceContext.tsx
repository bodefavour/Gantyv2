import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface Workspace {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    setCurrentWorkspace: (workspace: Workspace) => void;
    loading: boolean;
    refetchWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWorkspaces = useCallback(async () => {
        if (!user) {
            setWorkspaces([]);
            setCurrentWorkspace(null);
            setLoading(false);
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('workspace_members')
                .select(`
                    workspace_id,
                    role,
                    workspaces!inner (
                        id,
                        name,
                        description,
                        owner_id
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userWorkspaces = (data || []).map((item: any) => ({
                id: item.workspaces.id,
                name: item.workspaces.name,
                description: item.workspaces.description,
                owner_id: item.workspaces.owner_id,
                role: item.role
            }));

            setWorkspaces(userWorkspaces);

            if (userWorkspaces.length > 0 && !currentWorkspace) {
                setCurrentWorkspace(userWorkspaces[0]);
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error);
        } finally {
            setLoading(false);
        }
    }, [user, currentWorkspace]);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                currentWorkspace,
                setCurrentWorkspace,
                loading,
                refetchWorkspaces: fetchWorkspaces
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}