import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useWebSocket } from './contexts/WebSocketContext';
import 'xterm/css/xterm.css';

const BareTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { status, send, onMessage, offMessage, error } = useWebSocket();
  const [sessionId] = useState(() => `session-${Date.now()}`);

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
    const handleMessage = (data: any) => {
      if (data.type === 'output' && xtermRef.current) {
        xtermRef.current.write(data.data);
      } else if (data.type === 'status') {
        console.log('Session status:', data.status);
        if (data.status === 'started' && xtermRef.current) {
          xtermRef.current.writeln('\r\n\x1b[32mClaude session started!\x1b[0m\r\n');
        }
      } else if (data.type === 'error') {
        console.error('Session error:', data.error);
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[31mError: ${data.error}\x1b[0m`);
        }
      }
    };

    onMessage(handleMessage);
    return () => offMessage(handleMessage);
  }, [onMessage, offMessage]);

  // Handle terminal input
  useEffect(() => {
    if (!xtermRef.current || status !== 'session-started') return;

    const handleData = (data: string) => {
      send({
        type: 'input',
        data: data,
        sessionId: sessionId
      });
    };

    const disposable = xtermRef.current.onData(handleData);
    return () => disposable.dispose();
  }, [send, sessionId, status]);

  // Handle terminal resize
  useEffect(() => {
    if (!xtermRef.current || !fitAddonRef.current || status !== 'session-started') return;

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        send({
          type: 'resize',
          cols,
          rows,
          sessionId
        });
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
  }, [send, sessionId, status]);

  // Start session when WebSocket is connected
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Starting terminal session...');
      if (xtermRef.current) {
        xtermRef.current.writeln('Starting Claude session...');
      }
      send({
        type: 'start',
        sessionId: sessionId
      });
    }
  }, [status, send, sessionId]);

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
            {status === 'authenticated' && 'Starting session...'}
            {status === 'session-started' && 'Connected'}
            {status === 'disconnected' && 'Disconnected'}
            {status === 'error' && error && `Error: ${error}`}
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