-- Create workspace_invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status column separately (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workspace_invitations' 
                   AND column_name = 'status') THEN
        ALTER TABLE workspace_invitations 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_id ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_status ON workspace_invitations(status);

-- Enable RLS
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON workspace_invitations;
DROP POLICY IF EXISTS "Workspace members can create invitations" ON workspace_invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON workspace_invitations;

-- Create RLS policies
-- Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to them" ON workspace_invitations
  FOR SELECT USING (
    email = auth.jwt() ->> 'email' OR
    invited_by = auth.uid()
  );

-- Workspace admins/editors can create invitations
CREATE POLICY "Workspace members can create invitations" ON workspace_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_invitations.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('admin', 'editor')
    )
  );

-- Users can update invitations (accept/decline)
CREATE POLICY "Users can update their invitations" ON workspace_invitations
  FOR UPDATE USING (
    email = auth.jwt() ->> 'email' OR
    invited_by = auth.uid()
  );
