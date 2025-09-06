export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    first_name: string | null;
                    last_name: string | null;
                    avatar_url: string | null;
                    timezone: string;
                    date_format: string;
                    time_format: string;
                    language: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    first_name?: string | null;
                    last_name?: string | null;
                    avatar_url?: string | null;
                    timezone?: string;
                    date_format?: string;
                    time_format?: string;
                    language?: string;
                };
                Update: {
                    first_name?: string | null;
                    last_name?: string | null;
                    avatar_url?: string | null;
                    timezone?: string;
                    date_format?: string;
                    time_format?: string;
                    language?: string;
                };
            };
            workspaces: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    owner_id: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    name: string;
                    description?: string | null;
                    owner_id: string;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                };
            };
            workspace_members: {
                Row: {
                    id: string;
                    workspace_id: string;
                    user_id: string;
                    role: 'owner' | 'admin' | 'member' | 'viewer';
                    created_at: string;
                };
                Insert: {
                    workspace_id: string;
                    user_id: string;
                    role: 'owner' | 'admin' | 'member' | 'viewer';
                };
                Update: {
                    role?: 'owner' | 'admin' | 'member' | 'viewer';
                };
            };
            projects: {
                Row: {
                    id: string;
                    workspace_id: string;
                    name: string;
                    description: string | null;
                    start_date: string;
                    end_date: string | null;
                    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
                    progress: number;
                    priority: string;
                    color: string;
                    is_template: boolean;
                    template_id: string | null;
                    settings: Record<string, unknown>;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    workspace_id: string;
                    name: string;
                    description?: string | null;
                    start_date: string;
                    end_date?: string | null;
                    status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
                    progress?: number;
                    priority?: string;
                    color?: string;
                    is_template?: boolean;
                    template_id?: string | null;
                    settings?: Record<string, unknown>;
                    created_by: string;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    start_date?: string;
                    end_date?: string | null;
                    status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
                    progress?: number;
                    priority?: string;
                    color?: string;
                    is_template?: boolean;
                    template_id?: string | null;
                    settings?: Record<string, unknown>;
                };
            };
            tasks: {
                Row: {
                    id: string;
                    project_id: string;
                    parent_id: string | null;
                    name: string;
                    description: string | null;
                    start_date: string;
                    end_date: string;
                    duration: number;
                    progress: number;
                    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
                    priority: 'low' | 'medium' | 'high' | 'critical';
                    assigned_to: string | null;
                    estimated_hours: number | null;
                    actual_hours: number;
                    color: string;
                    is_milestone: boolean;
                    sort_order: number;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    project_id: string;
                    parent_id?: string | null;
                    name: string;
                    description?: string | null;
                    start_date: string;
                    end_date: string;
                    duration?: number;
                    progress?: number;
                    status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
                    priority?: 'low' | 'medium' | 'high' | 'critical';
                    assigned_to?: string | null;
                    estimated_hours?: number | null;
                    actual_hours?: number;
                    color?: string;
                    is_milestone?: boolean;
                    sort_order?: number;
                    created_by: string;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    start_date?: string;
                    end_date?: string;
                    duration?: number;
                    progress?: number;
                    status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
                    priority?: 'low' | 'medium' | 'high' | 'critical';
                    assigned_to?: string | null;
                    estimated_hours?: number | null;
                    actual_hours?: number;
                    color?: string;
                    is_milestone?: boolean;
                    sort_order?: number;
                };
            };
            task_dependencies: {
                Row: {
                    id: string;
                    predecessor_id: string;
                    successor_id: string;
                    type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
                    lag: number;
                    created_at: string;
                };
                Insert: {
                    predecessor_id: string;
                    successor_id: string;
                    type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
                    lag?: number;
                };
                Update: {
                    type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
                    lag?: number;
                };
            };
            milestones: {
                Row: {
                    id: string;
                    project_id: string;
                    name: string;
                    description: string | null;
                    due_date: string;
                    status: 'pending' | 'completed' | 'overdue';
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    project_id: string;
                    name: string;
                    description?: string | null;
                    due_date: string;
                    status?: 'pending' | 'completed' | 'overdue';
                    created_by: string;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    due_date?: string;
                    status?: 'pending' | 'completed' | 'overdue';
                };
            };
            custom_fields: {
                Row: {
                    id: string;
                    workspace_id: string;
                    entity_type: 'project' | 'task';
                    name: string;
                    field_type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean';
                    options: string[];
                    required: boolean;
                    created_at: string;
                };
                Insert: {
                    workspace_id: string;
                    entity_type: 'project' | 'task';
                    name: string;
                    field_type?: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean';
                    options?: string[];
                    required?: boolean;
                };
                Update: {
                    name?: string;
                    field_type?: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean';
                    options?: string[];
                    required?: boolean;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    type: string;
                    title: string;
                    message: string;
                    data: Record<string, unknown>;
                    read_at: string | null;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    workspace_id?: string | null;
                    type: string;
                    title: string;
                    message: string;
                    data?: Record<string, unknown>;
                };
                Update: {
                    read_at?: string | null;
                };
            };
            export_jobs: {
                Row: {
                    id: string;
                    workspace_id: string;
                    project_id: string | null;
                    user_id: string;
                    export_type: string;
                    status: 'pending' | 'processing' | 'completed' | 'failed';
                    file_url: string | null;
                    error_message: string | null;
                    created_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    workspace_id: string;
                    project_id?: string | null;
                    user_id: string;
                    export_type: string;
                    status?: 'pending' | 'processing' | 'completed' | 'failed';
                };
                Update: {
                    status?: 'pending' | 'processing' | 'completed' | 'failed';
                    file_url?: string | null;
                    error_message?: string | null;
                    completed_at?: string | null;
                };
            };
            workspace_invitations: {
                Row: {
                    id: string;
                    workspace_id: string;
                    email: string;
                    role: 'admin' | 'member' | 'viewer';
                    invited_by: string;
                    status: 'pending' | 'accepted' | 'declined';
                    token: string;
                    expires_at: string;
                    created_at: string;
                };
                Insert: {
                    workspace_id: string;
                    email: string;
                    role: 'admin' | 'member' | 'viewer';
                    invited_by: string;
                    token: string;
                    expires_at: string;
                };
                Update: {
                    status?: 'pending' | 'accepted' | 'declined';
                };
            };
            comments: {
                Row: {
                    id: string;
                    project_id: string | null;
                    task_id: string | null;
                    author_id: string;
                    content: string;
                    parent_id: string | null;
                    mentions: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    project_id?: string | null;
                    task_id?: string | null;
                    author_id: string;
                    content: string;
                    parent_id?: string | null;
                    mentions?: string[];
                };
                Update: {
                    content?: string;
                    mentions?: string[];
                };
            };
            activity_logs: {
                Row: {
                    id: string;
                    workspace_id: string;
                    user_id: string;
                    action: string;
                    entity_type: 'workspace' | 'project' | 'task' | 'milestone' | 'member';
                    entity_id: string | null;
                    project_id: string | null;
                    task_id: string | null;
                    old_values: Record<string, unknown> | null;
                    new_values: Record<string, unknown> | null;
                    metadata: Record<string, unknown>;
                    created_at: string;
                };
                Insert: {
                    workspace_id: string;
                    user_id: string;
                    action: string;
                    entity_type: 'workspace' | 'project' | 'task' | 'milestone' | 'member';
                    entity_id?: string | null;
                    project_id?: string | null;
                    task_id?: string | null;
                    old_values?: Record<string, unknown> | null;
                    new_values?: Record<string, unknown> | null;
                    metadata?: Record<string, unknown>;
                };
                Update: {
                    metadata?: Record<string, unknown>;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}

// Additional type exports
export type ActivityLogWithDetails = Database['public']['Tables']['activity_logs']['Row'] & {
    user?: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string;
    };
};