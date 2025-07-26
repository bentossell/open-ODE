import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useWebSocket } from './contexts/WebSocketContext';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { supabase } from './lib/supabase';
import { Plus } from 'lucide-react';

export const XTerminal: React.FC = () => {
  const { status, send, onMessage, offMessage, connect, disconnect, error } = useWebSocket();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const sessionStarted = status === 'session-started';

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Instantiate a *completely* unmodified xterm instance – no custom theme or font overrides.
    const term = new Terminal();

    const fitAddon = new FitAddon();
    
    // Only load the FitAddon so the terminal resizes correctly.
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Show initial welcome message
    term.writeln('Welcome to OpenODE!');
    term.writeln('Click "New Session" to start coding with Claude.');
    term.writeln('');

    // Handle terminal input
    term.onData((data) => {
      if (sessionStarted) {
        send({ type: 'input', data });
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
    };
  }, [send, sessionStarted]);

  // Connect WebSocket on mount
  useEffect(() => {
    connect().catch(err => {
      console.error('Failed to connect WebSocket:', err);
    });
  }, [connect]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.type === 'output' && xtermRef.current) {
        // Just write to terminal - no parsing
        xtermRef.current.write(data.data);
      } else if (data.type === 'status') {
        if (data.status === 'started') {
          xtermRef.current?.writeln('\r\n✅ Session started! You can now interact with Claude.\r\n');
        } else if (data.status === 'error') {
          xtermRef.current?.writeln(`\r\n❌ Error: ${data.error}\r\n`);
        }
      }
    };

    onMessage(handleMessage);
    return () => offMessage(handleMessage);
  }, [onMessage, offMessage]);

  const startSession = async (event?: React.MouseEvent) => {
    console.log('🚀 Start session clicked', { 
      status, 
      sessionStarted,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      timestamp: new Date().toISOString()
    });

    // Prevent event propagation and default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (status === 'session-started') {
      console.log('⚠️ Session already started, skipping');
      return;
    }

    try {
      console.log('📡 Current WebSocket status:', status);
      
      // Write to terminal regardless of connection status
      xtermRef.current?.writeln('\r\n🔄 Attempting to start session...\r\n');
      
      // Make sure we're connected first
      if (status !== 'authenticated') {
        console.log('🔌 Connecting WebSocket first...');
        xtermRef.current?.writeln('🔌 Connecting to server...\r\n');
        await connect();
        console.log('✅ WebSocket connection attempt completed');
      }
      
      console.log('📤 Sending start command...');
      xtermRef.current?.writeln('🚀 Starting Claude session...\r\n');
      
      // Send the start command
      send({ type: 'start' });
      
      console.log('✅ Start command sent successfully');
      
    } catch (err) {
      console.error('❌ Failed to start session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      xtermRef.current?.writeln(`\r\n❌ Failed to start session: ${errorMessage}\r\n`);
      xtermRef.current?.writeln('Please try refreshing the page or check your connection.\r\n');
    }
  };

  const handleSignOut = async () => {
    try {
      // Disconnect WebSocket first
      disconnect();
      
      // Clear terminal
      if (xtermRef.current) {
        xtermRef.current.clear();
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // The auth state change listener in App.tsx will handle the UI update
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback to reload if sign out fails
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Sidebar - Top on mobile, left on desktop */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card">
        <div className="p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-2">OpenODE</h1>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full justify-start gap-2 text-base font-medium"
              onClick={startSession}
              disabled={sessionStarted}
              onTouchStart={() => console.log('Button touched')}
              onTouchEnd={() => console.log('Button touch ended')}
              style={{ 
                minHeight: '48px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              <Plus className="h-5 w-5" />
              {sessionStarted ? 'Session Active' : 'New Session'}
            </Button>
            
            {/* Mobile Debug Info */}
            <div className="mt-4 md:hidden text-xs text-muted-foreground space-y-1">
              <div>Status: {status}</div>
              {error && <div className="text-red-500">Error: {error}</div>}
              <div>Touch: {'ontouchstart' in window ? 'Yes' : 'No'}</div>
              <div>Mobile: {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Yes' : 'No'}</div>
            </div>
            
            {/* Alternative Start Button for Mobile Debugging */}
            {!sessionStarted && (
              <Button 
                variant="default" 
                size="lg" 
                className="w-full mt-2 md:hidden"
                onClick={(e) => {
                  console.log('Alternative button clicked');
                  startSession(e);
                }}
                style={{ 
                  minHeight: '48px',
                  touchAction: 'manipulation'
                }}
              >
                🚀 Start Session (Alt)
              </Button>
            )}
          </div>
          
          <div className="space-y-4 hidden md:block">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">WORKSPACE</h3>
              <div className="space-y-1">
                <div className="rounded-md p-2 bg-secondary">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                    <p className="font-medium text-sm">Current Project</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">Active workspace</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-border bg-card px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={status === 'session-started' ? 'default' : 'secondary'}>
                {status === 'session-started' ? '🟢 Session Active' : 
                 status === 'authenticated' ? '🟡 Connected - Start Session' :
                 status === 'connecting' ? '🟠 Connecting...' :
                 status === 'error' ? '🔴 Error' :
                 '⚪ Disconnected'}
              </Badge>
              {/* Mobile Quick Start Button */}
              {!sessionStarted && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="md:hidden"
                  onClick={startSession}
                  style={{ 
                    minHeight: '40px',
                    touchAction: 'manipulation'
                  }}
                >
                  Start
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Terminal Area */}
        <div className="flex-1 p-4">
          <div className="h-full overflow-hidden">
            <div ref={terminalRef} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
