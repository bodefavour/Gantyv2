import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/landing/LandingPage';
import MarketingPage from './components/landing/MarketingPage';
import SignupPage from './auth/SignupPage';
import LoginPage from './auth/LoginPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Dashboard from './dashboard/Dashboard';
import ProtectedRoute from './auth/ProtectedRoute';
import AcceptInvitePage from './components/invitations/AcceptInvitePage';
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
              <Route path="/product" element={<MarketingPage title="Product" description="Explore Ganty features for planning, scheduling, and collaboration." />} />
              <Route path="/plans" element={<MarketingPage title="Plans" description="Choose a plan that fits your team, from solo to enterprise." />} />
              <Route path="/pricing" element={<MarketingPage title="Pricing" description="Simple, transparent pricing. Start free and scale as you grow." />} />
              <Route path="/demo" element={<MarketingPage title="Live Demo" description="Book a live demo with our product experts and see Ganty in action." />} />
              <Route path="/templates" element={<MarketingPage title="Templates" description="Kickstart projects with free, ready-to-use Gantt chart templates." />} />
              <Route path="/faq" element={<MarketingPage title="FAQ" description="Answers to common questions about Ganty and Gantt charts." />} />
              <Route path="/auth" element={<SignupPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingWrapper />} />
              <Route path="/invite/accept/:token" element={<AcceptInvitePage />} />
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