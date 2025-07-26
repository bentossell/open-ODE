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
  const { status, send, onMessage, offMessage, connect, disconnect } = useWebSocket();
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

  const startSession = async () => {
    if (status === 'session-started') return;

    try {
      if (status !== 'authenticated') {
        await connect();
      }
      send({ type: 'start' });
    } catch (err) {
      console.error('Failed to start session:', err);
      xtermRef.current?.writeln(`\r\n❌ Failed to start session: ${err instanceof Error ? err.message : 'Unknown error'}\r\n`);
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
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border bg-card">
        <div className="p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-2">OpenODE</h1>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={startSession}
              onTouchStart={startSession}
              disabled={sessionStarted}
            >
              <Plus className="h-4 w-4" />
              {sessionStarted ? 'Session Active' : 'New Session'}
            </Button>
          </div>
          
          <div className="space-y-4">
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
          {/* Render the terminal with **no** additional styling so that nothing interferes with xterm's defaults */}
          <div className="h-full overflow-hidden">
            <div ref={terminalRef} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
