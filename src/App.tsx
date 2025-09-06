import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/landing/LandingPage';
import SignupPage from './auth/SignupPage';
import LoginPage from './auth/LoginPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Dashboard from './dashboard/Dashboard';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function OnboardingWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Allow access to onboarding even without full authentication if we have pending signup data
  const pendingSignupData = localStorage.getItem('pendingSignupData');
  if (!user && !pendingSignupData) {
    return <Navigate to="/login" replace />;
  }

  return <OnboardingFlow />;
}

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<SignupPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingWrapper />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;