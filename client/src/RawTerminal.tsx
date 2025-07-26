import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useWebSocket } from './contexts/WebSocketContext';

export const RawTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { status, send, onMessage, offMessage, connect } = useWebSocket();

  // Initialize pure xterm with zero modifications
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Absolutely minimal terminal configuration
    const term = new Terminal();
    const fitAddon = new FitAddon();
    
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Direct input forwarding - no modifications
    const inputDisposable = term.onData((data) => {
      if (status === 'session-started') {
        send({ type: 'input', data });
      }
    });

    // Basic resize handling
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      inputDisposable.dispose();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [send, status]);

  // Connect WebSocket
  useEffect(() => {
    connect().catch(console.error);
  }, [connect]);

  // Direct output forwarding - no modifications
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.type === 'output' && xtermRef.current) {
        xtermRef.current.write(data.data);
      }
    };

    onMessage(handleMessage);
    return () => offMessage(handleMessage);
  }, [onMessage, offMessage]);

  // Auto-start session
  useEffect(() => {
    if (status === 'authenticated' && xtermRef.current) {
      send({ type: 'start' });
    }
  }, [status, send]);

  // Absolutely minimal container - no styling
  return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
};