-- Create invitations table for email-based user invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'manager', 'member', 'viewer'
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON public.invitations(workspace_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
CREATE POLICY "Users can view invitations in their workspaces" ON public.invitations
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace admins can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Workspace admins can update invitations" ON public.invitations
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Public policy for accepting invitations (anyone with valid token)
CREATE POLICY "Anyone can accept valid invitations" ON public.invitations
    FOR SELECT USING (
        status = 'pending' AND expires_at > NOW()
    );

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS VOID AS $$
BEGIN
    UPDATE public.invitations 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to expire old invitations (if pg_cron is available)
-- This would need to be run manually or via a cron job if pg_cron is not available
-- SELECT cron.schedule('expire-invitations', '0 */6 * * *', 'SELECT expire_old_invitations();');
