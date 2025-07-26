import React, { useEffect } from 'react';
import './index.css';
import { RawTerminal } from './RawTerminal';
import { TestTerminal } from './TestTerminal';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading } = useAuth();

  // Reset body styles to ensure full viewport usage
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    
    return () => {
      // Reset on unmount
      document.body.style.overflow = '';
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        fontFamily: 'system-ui' 
      }}>
        Loading...
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

  // For now, use TestTerminal to verify xterm works
  // return (
  //   <ErrorBoundary>
  //     <WebSocketProvider>
  //       <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
  //         <RawTerminal />
  //       </div>
  //     </WebSocketProvider>
  //   </ErrorBoundary>
  // );

  return <TestTerminal />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
