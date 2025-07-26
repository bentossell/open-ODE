import React from 'react';
import './index.css';
// import { OpenTerminal } from './OpenTerminal';
import BareTerminal from './BareTerminal';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Auth onAuthenticated={() => {
          // Auth state change will be handled by AuthContext
        }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <WebSocketProvider>
        <BareTerminal />
      </WebSocketProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
