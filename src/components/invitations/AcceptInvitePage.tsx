import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Check, X, Clock } from 'lucide-react';
import { useInvitations } from '../../hooks/useInvitations';
import { useAuth } from '../../contexts/AuthContext';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptInvitation } = useInvitations();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [invitation, setInvitation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link');
      setLoading(false);
      return;
    }

    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/auth?returnUrl=${returnUrl}`);
      return;
    }

    handleAcceptInvitation();
  }, [token, user]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const acceptedInvitation = await acceptInvitation(token);
      setInvitation(acceptedInvitation);
      setStatus('success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      const message = error instanceof Error ? error.message : 'Failed to accept invitation';
      
      if (message.includes('expired')) {
        setStatus('expired');
      } else {
        setStatus('error');
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Invitation</h2>
            <p className="text-gray-600">Please wait while we add you to the workspace...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to the team!</h2>
            <p className="text-gray-600 mb-4">
              You've successfully joined the workspace as a {invitation?.role}.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard in a few seconds...
            </p>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invitation Expired</h2>
            <p className="text-gray-600 mb-6">
              This invitation link has expired. Please ask your team lead to send a new invitation.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'This invitation link is invalid or has already been used.'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Calendar className="w-8 h-8 text-teal-600" />
            <span className="text-2xl font-bold text-teal-700">GANTTPRO</span>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
