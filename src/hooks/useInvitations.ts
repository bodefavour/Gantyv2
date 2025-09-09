import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import emailjs from '@emailjs/browser';

export interface Invitation {
  id: string;
  workspace_id: string;
  project_id?: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  metadata: Record<string, any>;
}

export function useInvitations() {
  const { currentWorkspace } = useWorkspace();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInvitations(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invitations';
      setError(errorMessage);
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const sendInvitation = async (
    email: string,
    role: 'admin' | 'manager' | 'member' | 'viewer',
    projectId?: string
  ) => {
    if (!currentWorkspace) throw new Error('No workspace selected');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Generate a secure token
      const token = crypto.randomUUID() + '-' + Date.now();

      const invitationData = {
        workspace_id: currentWorkspace.id,
        project_id: projectId || null,
        email,
        role,
        invited_by: user.data.user.id,
        token,
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        metadata: {}
      };

      const { data, error } = await (supabase as any)
        .from('invitations')
        .insert(invitationData)
        .select()
        .single();

      if (error) throw error;

      // Send email via EmailJS - hardcoded config for development
      const emailParams = {
        to_email: email,
        to_name: email.split('@')[0],
        workspace_name: currentWorkspace.name,
        role: role,
        inviter_name: user.data.user.user_metadata?.full_name || user.data.user.email,
        accept_url: `${window.location.origin}/invite/accept/${token}`,
        expires_in: '7 days'
      };

      // Hardcoded EmailJS configuration - replace with your actual values
      const EMAILJS_SERVICE_ID = 'service_your_id';
      const EMAILJS_TEMPLATE_ID = 'template_your_id';  
      const EMAILJS_PUBLIC_KEY = 'your_public_key';

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          emailParams,
          EMAILJS_PUBLIC_KEY
        );
      } catch (emailError) {
        console.warn('Email sending failed, but invitation was created:', emailError);
        // Continue anyway - invitation was saved to database
      }

      setInvitations(prev => [data, ...prev]);
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      // First, get the invitation details
      const { data: invitation, error: fetchError } = await (supabase as any)
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      if (new Date((invitation as any).expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Check if user is already a member of the workspace
      const { data: existingMember } = await (supabase as any)
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', (invitation as any).workspace_id)
        .eq('user_id', user.data.user.id)
        .single();

      if (!existingMember) {
        // Add user to workspace
        const { error: memberError } = await (supabase as any)
          .from('workspace_members')
          .insert({
            workspace_id: (invitation as any).workspace_id,
            user_id: user.data.user.id,
            role: (invitation as any).role,
            joined_at: new Date().toISOString()
          });

        if (memberError) throw memberError;
      }

      // If invitation is for a specific project, add to project team
      if ((invitation as any).project_id) {
        const { error: projectMemberError } = await (supabase as any)
          .from('project_members')
          .upsert({
            project_id: (invitation as any).project_id,
            user_id: user.data.user.id,
            role: (invitation as any).role,
            added_by: (invitation as any).invited_by,
            added_at: new Date().toISOString()
          });

        if (projectMemberError) throw projectMemberError;
      }

      // Mark invitation as accepted
      const { error: updateError } = await (supabase as any)
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', (invitation as any).id);

      if (updateError) throw updateError;

      return invitation;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;

      setInvitations(prev =>
        prev.map(inv =>
          inv.id === invitationId ? { ...inv, status: 'expired' as const } : inv
        )
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    acceptInvitation,
    cancelInvitation,
  };
}
