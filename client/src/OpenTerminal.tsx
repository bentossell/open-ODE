import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { useWebSocket } from './contexts/WebSocketContext';
import { supabase } from './lib/supabase';
import { 
  Home, 
  Plus, 
  FolderPlus, 
  Archive, 
  MessageSquare, 
  Settings, 
  PanelRight,
  Play,
  LogOut,
  Terminal as TerminalIcon,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const OpenTerminal: React.FC = () => {
  const { status, send, onMessage, offMessage, connect, disconnect } = useWebSocket();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const sessionStarted = status === 'session-started';

  // Initialize xterm with light theme
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#333333',
        cursorAccent: '#ffffff',
        selectionBackground: '#3b82f6',
        selectionForeground: '#ffffff',
        black: '#000000',
        red: '#dc2626',
        green: '#16a34a',
        yellow: '#f59e0b',
        blue: '#2563eb',
        magenta: '#9333ea',
        cyan: '#06b6d4',
        white: '#f3f4f6',
        brightBlack: '#6b7280',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#fbbf24',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#14b8a6',
        brightWhite: '#ffffff'
      },
    });

    const fitAddon = new FitAddon();
    
    // Configure WebLinksAddon with custom handler
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        window.open(uri, '_blank', 'noopener,noreferrer');
      }
    });
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('🚀 Welcome to OpenODE Terminal');
    term.writeln('');
    term.writeln('Click "Start Session" to begin coding with Claude.');
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
      if (sessionStarted) {
        const dimensions = fitAddon.proposeDimensions();
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
    if (sessionStarted) return;
    
    xtermRef.current?.writeln('\r\n🔄 Starting session...\r\n');
    
    if (status === 'authenticated') {
      send({ type: 'start' });
    } else {
      await connect();
    }
  };

  const handleSignOut = async () => {
    try {
      disconnect();
      if (xtermRef.current) {
        xtermRef.current.clear();
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      window.location.reload();
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b border-gray-200">
          <Home className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">OpenODE</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="text-xs uppercase text-gray-500 mb-2">Workspaces</div>
            <div className="space-y-1">
              <div className="px-3 py-2 rounded-md bg-blue-50 border border-blue-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Terminal Session</span>
                </div>
                <span className="text-xs text-blue-600 ml-6">Active workspace</span>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm text-gray-600 mt-3 hover:text-gray-900 w-full px-3 py-2">
              <Plus className="w-4 h-4" /> 
              <span>New workspace</span>
            </button>
          </div>

          {/* Session Status */}
          <div className="px-3 py-3 bg-gray-50 rounded-md">
            <div className="text-xs uppercase text-gray-500 mb-2">Session Status</div>
            <div className="flex items-center gap-2">
              {status === 'session-started' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700">Active</span>
                </>
              ) : status === 'authenticated' ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-sm text-yellow-700">Ready</span>
                </>
              ) : status === 'connecting' ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-sm text-orange-700">Connecting...</span>
                </>
              ) : status === 'error' ? (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">Error</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 flex items-center justify-between border-t border-gray-200 text-gray-500 text-sm">
          <button className="flex items-center gap-2 hover:text-gray-700">
            <FolderPlus className="w-4 h-4" /> 
            <span>Add repository</span>
          </button>
          <div className="flex items-center gap-3">
            <button className="hover:text-gray-700">
              <Archive className="w-4 h-4" />
            </button>
            <button className="hover:text-gray-700">
              <MessageSquare className="w-4 h-4" />
            </button>
            <button className="hover:text-gray-700">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-900">Terminal Session</span>
            <button
              onClick={startSession}
              disabled={sessionStarted}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sessionStarted
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Play className="w-4 h-4" />
              {sessionStarted ? 'Session Active' : 'Start Session'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              <PanelRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Terminal Container */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6">
            <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Claude Terminal</span>
                </div>
              </div>
              <div ref={terminalRef} className="h-full p-4" />
            </div>
          </div>

          {/* Right Panel */}
          {rightPanelOpen && (
            <aside className="w-80 border-l border-gray-200 bg-white flex flex-col">
              <div className="flex-1 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Session Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium">
                      {sessionStarted ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Connection:</span>
                    <span className="ml-2 font-medium capitalize">{status}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Tips</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Type naturally to Claude</li>
                    <li>• Use /help for commands</li>
                    <li>• Ctrl+C to cancel operations</li>
                    <li>• Links are clickable in terminal</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-200 p-4">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4" />
                  Terminal Settings
                </button>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};