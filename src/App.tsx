import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/landing/LandingPage.tsx';
import AuthPage from './auth/AuthPage.tsx';
import Dashboard from './dashboard/Dashboard.tsx';
import ProtectedRoute from './auth/ProtectedRoute.tsx';

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
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