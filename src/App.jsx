import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import AuthPage from './components/auth/AuthPage';
import { initializeTheme } from './utils/themeUtils';

// Main App Component with Auth Check
const AppContent = () => {
  const { user, loading, authChecked } = useAuth();

  // Show loading spinner while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading IMC ICCC System...</p>
        </div>
      </div>
    );
  }

  // Show auth page if user is not logged in
  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Show dashboard if user is authenticated and approved
  return <Dashboard />;
};

function App() {
  useEffect(() => {
    // Initialize theme on app startup
    initializeTheme();
  }, []);

  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
