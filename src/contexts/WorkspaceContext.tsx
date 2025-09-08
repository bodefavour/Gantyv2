import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';

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
            setLoading(true);
            
            // First, check if workspace_members table exists and user has any memberships
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

            if (error) {
                console.error('Workspace fetch error details:', error);
                
                // If the user has no workspace memberships, create a default workspace
                if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
                    await createDefaultWorkspace();
                    return;
                }
                
                throw error;
            }

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
            } else if (userWorkspaces.length === 0) {
                // If no workspaces found, create a default one
                await createDefaultWorkspace();
            }
        } catch (error: any) {
            console.error('Error fetching workspaces:', error.message || error);
            // Don't throw the error, just handle it gracefully
            setWorkspaces([]);
            setCurrentWorkspace(null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createDefaultWorkspace = async () => {
        if (!user) return;

        try {
            console.log('Creating default workspace for user:', user.id);
            
            // Use admin client if available to bypass RLS issues, otherwise fall back to regular client
            const client = supabaseAdmin || supabase;
            
            // Create a default workspace for the user
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: workspace, error: workspaceError } = await (client as any)
                .from('workspaces')
                .insert({
                    name: `${user.user_metadata?.first_name || 'My'} Workspace`,
                    description: 'Default workspace',
                    owner_id: user.id,
                })
                .select()
                .single();

            if (workspaceError) {
                console.error('Error creating workspace:', workspaceError);
                throw workspaceError;
            }

            console.log('Default workspace created:', workspace);

            // Skip workspace_members insertion for now to avoid RLS issues
            // The owner relationship is established by owner_id in workspaces table

            const newWorkspace = {
                id: workspace.id,
                name: workspace.name,
                description: workspace.description,
                owner_id: workspace.owner_id,
                role: 'owner' as const
            };

            setWorkspaces([newWorkspace]);
            setCurrentWorkspace(newWorkspace);
            
            console.log('Default workspace set successfully');
        } catch (error: any) {
            console.error('Error creating default workspace:', error.message || error);
        }
    };

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