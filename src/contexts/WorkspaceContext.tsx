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
            
            const client = supabaseAdmin || supabase;

            // 1) Owned workspaces
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: owned, error: ownedErr } = await (client as any)
                .from('workspaces')
                .select('id,name,description,owner_id')
                .eq('owner_id', user.id);
            if (ownedErr) {
                console.error('Workspace fetch error details (owned):', ownedErr);
            }

            const ownedMapped = (owned || []).map((w: any) => ({
                id: w.id,
                name: w.name,
                description: w.description,
                owner_id: w.owner_id,
                role: 'owner' as const
            }));

            // 2) Member workspaces (use admin to avoid RLS/policy recursion)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: memberships, error: memErr } = await (client as any)
                .from('workspace_members')
                .select(`
                    role,
                    workspaces!inner (
                        id,
                        name,
                        description,
                        owner_id
                    )
                `)
                .eq('user_id', user.id);
            if (memErr) {
                console.error('Workspace fetch error details (memberships):', memErr);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const memberMapped = (memberships || []).map((m: any) => ({
                id: m.workspaces.id,
                name: m.workspaces.name,
                description: m.workspaces.description,
                owner_id: m.workspaces.owner_id,
                role: m.role
            }));

            // Merge unique by id preferring owner role if duplicate
            const mergedMap = new Map<string, Workspace>();
            for (const w of [...ownedMapped, ...memberMapped]) {
                if (!mergedMap.has(w.id)) mergedMap.set(w.id, w);
                else {
                    const existing = mergedMap.get(w.id)!;
                    mergedMap.set(w.id, existing.role === 'owner' ? existing : w);
                }
            }
            const userWorkspaces = Array.from(mergedMap.values());

            setWorkspaces(userWorkspaces);

            if (userWorkspaces.length > 0 && !currentWorkspace) {
                setCurrentWorkspace(userWorkspaces[0]);
            } else if (userWorkspaces.length === 0) {
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
            // Create a default workspace via RPC to also create membership atomically
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: workspace, error: workspaceError } = await (supabase as any)
                .rpc('create_workspace_with_membership', {
                    p_name: `${user.user_metadata?.first_name || 'My'} Workspace`,
                    p_description: 'Default workspace'
                });

            if (workspaceError) {
                console.error('Error creating workspace:', workspaceError);
                throw workspaceError;
            }

            console.log('Default workspace created:', workspace);

            const newWorkspace = {
                id: workspace.id,
                name: workspace.name,
                description: workspace.description,
                owner_id: workspace.owner_id as string,
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