import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { User } from '@supabase/supabase-js';
import { useWebSocket } from './contexts/WebSocketContext';
import { ChatInterface } from './ChatInterface';
import './App.css';

function ChatApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const { status, error, connect, disconnect, send } = useWebSocket();

  useEffect(() => {
    // Check for existing session
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        disconnect();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [disconnect]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const startSession = async () => {
    if (isStarting || status === 'session-started') return;
    setIsStarting(true);

    try {
      await connect();

      // Send start command
      send({
        type: 'start',
        userId: user?.id,
        userEmail: user?.email
      });
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setIsStarting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="App">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Auth onAuthenticated={checkUser} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Claude Code Chat</h1>
            <p>Interactive AI coding assistant</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#d4d4d4', fontSize: '0.9rem' }}>
              👤 {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                background: '#cd3131',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="controls" style={{ marginBottom: '1rem' }}>
        <button
          onClick={startSession}
          disabled={isStarting || status === 'session-started'}
          className="start-button"
        >
          {status === 'session-started' ? '✅ Session Active' : isStarting ? '⏳ Starting...' : '🚀 Start Session'}
        </button>

        <div className="status">
          Status: {
            status === 'disconnected' ? '🔴 Disconnected' :
            status === 'connecting' ? '🟡 Connecting...' :
            status === 'authenticated' ? '🟢 Connected' :
            status === 'session-started' ? '🟢 Session Active' :
            status === 'error' ? '🔴 Error' : '⚫ Unknown'
          }
        </div>

        {error && (
          <div style={{ color: '#cd3131', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            ❌ {error}
          </div>
        )}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <ChatInterface />
      </div>
    </div>
  );
}

export default ChatApp;