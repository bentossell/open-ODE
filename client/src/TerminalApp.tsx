import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { User } from '@supabase/supabase-js';
import { useWebSocket } from './contexts/WebSocketContext';
import 'xterm/css/xterm.css';
import './App.css';

function TerminalApp() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  
  const { status, error, connect, disconnect, send, onMessage, offMessage } = useWebSocket();
  const statusRef = useRef(status);
  
  // Keep statusRef in sync with status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    // Check for existing session
    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        disconnect();
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
          terminalInstanceRef.current = null;
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [disconnect]);

  useEffect(() => {
    // Handle WebSocket messages for terminal output
    const handleMessage = (data: any) => {
      if (!terminalInstanceRef.current) return;
      
      switch (data.type) {
        case 'output':
          terminalInstanceRef.current.write(data.data);
          break;
        case 'exit':
          terminalInstanceRef.current.writeln('\r\n\r\n[Process exited]');
          setIsStarting(false);
          break;
      }
    };

    onMessage(handleMessage);
    return () => offMessage(handleMessage);
  }, [onMessage, offMessage]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const initializeTerminal = () => {
    if (!terminalRef.current || terminalInstanceRef.current) return;

    // Initialize terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      }
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current && statusRef.current === 'session-started') {
        fitAddonRef.current.fit();
        const dimensions = fitAddonRef.current.proposeDimensions();
        if (dimensions) {
          send({
            type: 'resize',
            cols: dimensions.cols,
            rows: dimensions.rows
          });
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Terminal input handler
    term.onData((data) => {
      console.log('Terminal input received, status:', statusRef.current);
      if (statusRef.current === 'session-started') {
        send({
          type: 'input',
          data: data
        });
      }
    });

    term.writeln('🚀 Terminal initialized');
    term.writeln(`👤 Authenticated as: ${user?.email}`);
    term.writeln('\r\nStarting Claude session...\r\n');

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const startSession = async () => {
    if (isStarting || status === 'session-started') return;
    
    setIsStarting(true);
    
    try {
      // Initialize terminal first
      initializeTerminal();
      
      // Connect WebSocket and wait for authentication
      await connect();
      
      // Send start command
      send({
        type: 'start',
        userId: user?.id,
        userEmail: user?.email
      });
      
      // Send initial terminal size
      if (fitAddonRef.current) {
        const dimensions = fitAddonRef.current.proposeDimensions();
        if (dimensions) {
          send({
            type: 'resize',
            cols: dimensions.cols,
            rows: dimensions.rows
          });
        }
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.writeln(`\r\n❌ Error: ${err instanceof Error ? err.message : 'Failed to connect'}`);
      }
      setIsStarting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="App">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth component if not authenticated
  if (!user) {
    return <Auth onAuthenticated={checkUser} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Claude Code Terminal</h1>
            <p>Interactive AI coding assistant</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#d4d4d4', fontSize: '0.9rem' }}>👤 {user?.email}</span>
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
      
      <div className="controls">
        <button
          onClick={startSession}
          onTouchStart={startSession}
          disabled={isStarting || status === 'session-started'}
          className="start-button"
        >
          {status === 'session-started' ? '✅ Session Active' : 
           isStarting ? '⏳ Starting...' : '🚀 Start Session'}
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

      <div className="terminal-container" style={{ display: terminalInstanceRef.current ? 'block' : 'none' }}>
        <div 
          ref={terminalRef} 
          className="terminal" 
          onClick={() => status === 'session-started' && terminalInstanceRef.current?.focus()}
          style={{ cursor: status === 'session-started' ? 'text' : 'default' }}
        />
      </div>
      
      {!terminalInstanceRef.current && (
        <div className="welcome-container" style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#d4d4d4',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <h2>Welcome to Claude Code Terminal</h2>
          <p>Click "Start Session" above to begin your coding session with Claude.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#999' }}>
            Your session will be isolated and secure. All your work will be saved to your workspace.
          </p>
        </div>
      )}
    </div>
  );
}

export default TerminalApp;