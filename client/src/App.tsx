import React, { useState, useEffect } from 'react';
import './index.css';
import { OpenTerminal } from './OpenTerminal';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <ErrorBoundary>
        <Auth onAuthenticated={() => {
          // Auth state change will be handled by the listener
        }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <WebSocketProvider>
        <OpenTerminal />
      </WebSocketProvider>
    </ErrorBoundary>
  );
}

export default App;
