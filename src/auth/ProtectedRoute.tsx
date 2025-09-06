import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    // Allow access to onboarding even without full authentication if we have pending signup data
    if (location.pathname === '/onboarding') {
        const pendingSignupData = localStorage.getItem('pendingSignupData');
        if (pendingSignupData || user) {
            return <>{children}</>;
        }
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}