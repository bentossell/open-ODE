import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useWebSocket } from './contexts/WebSocketContext';
import 'xterm/css/xterm.css';

const BareTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { ws, status, sessionId, error } = useWebSocket();
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
      },
    });

    // Create and load fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Open terminal in the DOM
    term.open(terminalRef.current);
    
    // Fit terminal to container
    fitAddon.fit();

    // Store references
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws || !xtermRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'output' && xtermRef.current) {
        xtermRef.current.write(data.data);
      } else if (data.type === 'status') {
        console.log('Session status:', data.status);
        if (data.status === 'started') {
          setIsSessionStarted(true);
        }
      } else if (data.type === 'error') {
        console.error('Session error:', data.error);
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[31mError: ${data.error}\x1b[0m`);
        }
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  // Handle terminal input
  useEffect(() => {
    if (!xtermRef.current || !ws || !isSessionStarted) return;

    const handleData = (data: string) => {
      if (ws.readyState === WebSocket.OPEN && sessionId) {
        ws.send(JSON.stringify({
          type: 'input',
          data: data,
          sessionId: sessionId
        }));
      }
    };

    const disposable = xtermRef.current.onData(handleData);
    return () => disposable.dispose();
  }, [ws, sessionId, isSessionStarted]);

  // Handle terminal resize
  useEffect(() => {
    if (!xtermRef.current || !fitAddonRef.current || !ws || !sessionId || !isSessionStarted) return;

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current && ws.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        ws.send(JSON.stringify({
          type: 'resize',
          cols,
          rows,
          sessionId
        }));
      }
    };

    // Initial resize
    handleResize();

    // Listen for terminal resize
    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [ws, sessionId, isSessionStarted]);

  // Start session when WebSocket is connected
  useEffect(() => {
    if (status === 'authenticated' && ws && !isSessionStarted) {
      console.log('Starting terminal session...');
      ws.send(JSON.stringify({
        type: 'start',
        sessionId: sessionId
      }));
    }
  }, [status, ws, sessionId, isSessionStarted]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: '#1e1e1e',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Minimal status bar */}
      <div style={{
        backgroundColor: '#2d2d2d',
        color: '#d4d4d4',
        padding: '10px 20px',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderBottom: '1px solid #3e3e3e'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Claude Terminal</span>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            {status === 'connecting' && 'Connecting...'}
            {status === 'authenticating' && 'Authenticating...'}
            {status === 'authenticated' && !isSessionStarted && 'Starting session...'}
            {status === 'authenticated' && isSessionStarted && 'Connected'}
            {status === 'disconnected' && 'Disconnected'}
            {error && ` - ${error}`}
          </span>
        </div>
      </div>
      
      {/* Terminal container */}
      <div style={{ 
        flex: 1,
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <div 
          ref={terminalRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            backgroundColor: '#1e1e1e'
          }} 
        />
      </div>
    </div>
  );
};

export default BareTerminal;