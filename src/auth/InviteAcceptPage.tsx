import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InvitationData {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  invited_by: string;
  expires_at: string;
  status: string;
  workspace?: {
    name: string;
  };
  inviter?: {
    full_name: string;
  };
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('workspace_invitations')
          .select(`
            *,
            workspace:workspaces(name),
            inviter:profiles!invited_by(full_name)
          `)
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (error) {
          if (error.message?.includes('relation "workspace_invitations" does not exist')) {
            setError('Invitation system is not yet configured. Please contact your administrator.');
            setLoading(false);
            return;
          }
          throw error;
        }

        // Check if invitation is expired
        if (new Date((data as any).expires_at) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        setInvitation(data as any);
        setAuthData(prev => ({ ...prev, email: (data as any).email }));

        // Check if user needs to authenticate
        if (!user) {
          setNeedsAuth(true);
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, user]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    try {
      // Add user to workspace
      const { error: memberError } = await (supabase as any)
        .from('workspace_members')
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: user.id,
          role: invitation.role,
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await (supabase as any)
        .from('workspace_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleSignUp = async () => {
    if (authData.password !== authData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password,
        options: {
          data: {
            full_name: authData.fullName,
          },
        },
      });

      if (error) throw error;

      // User will be signed in automatically, invitation will be processed in next effect
      setNeedsAuth(false);
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authData.email,
        password: authData.password,
      });

      if (error) throw error;

      setNeedsAuth(false);
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calendar className="w-8 h-8 text-teal-600" />
              <span className="text-2xl font-bold text-teal-700">GANTTPRO</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join {invitation?.workspace?.name}</h1>
            <p className="text-gray-600">You've been invited by {invitation?.inviter?.full_name} as a {invitation?.role}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={authData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={authData.fullName}
                onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={authData.password}
                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={authData.confirmPassword}
                onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Confirm your password"
              />
            </div>

            <button
              onClick={handleSignUp}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Create Account & Join
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setAuthData({ ...authData, confirmPassword: '', fullName: '' });
                    // Show sign in form
                  }}
                  className="text-teal-600 hover:underline"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-teal-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
        <p className="text-gray-600 mb-6">
          {invitation?.inviter?.full_name} has invited you to join <strong>{invitation?.workspace?.name}</strong> as a {invitation?.role}.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600">
            <p><strong>Workspace:</strong> {invitation?.workspace?.name}</p>
            <p><strong>Role:</strong> {invitation?.role}</p>
            <p><strong>Invited by:</strong> {invitation?.inviter?.full_name}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            onClick={handleAcceptInvitation}
            disabled={accepting}
            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {accepting ? 'Joining...' : 'Accept & Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
