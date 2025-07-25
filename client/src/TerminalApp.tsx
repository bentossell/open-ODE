import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './App.css';

function TerminalApp() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const sessionStartedRef = useRef(false);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Fetch server configuration first
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        initializeTerminal(config.wsPort || 8081);
      })
      .catch(() => {
        // Fallback if config endpoint fails
        initializeTerminal(8081);
      });
  }, []);

  const initializeTerminal = (wsPort: number) => {
    if (!terminalRef.current) return;

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

    setTerminal(term);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws && sessionStartedRef.current) {
        const dimensions = fitAddon.proposeDimensions();
        if (dimensions) {
          ws.send(JSON.stringify({
            type: 'resize',
            cols: dimensions.cols,
            rows: dimensions.rows
          }));
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Connect to WebSocket
    const websocket = new WebSocket(`ws://localhost:${wsPort}`);
    
    websocket.onopen = () => {
      setConnected(true);
      term.writeln('🚀 Connected to Claude terminal server');
      term.writeln('Click "Start Session" to begin...\r\n');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'output':
          term.write(data.data);
          break;
        case 'status':
          if (data.status === 'started') {
            setSessionStarted(true);
            sessionStartedRef.current = true;
            term.clear();
            term.focus();
            // Send initial terminal size
            const dimensions = fitAddon.proposeDimensions();
            if (dimensions) {
              websocket.send(JSON.stringify({
                type: 'resize',
                cols: dimensions.cols,
                rows: dimensions.rows
              }));
            }
          } else if (data.status === 'error') {
            term.writeln(`\r\n❌ Error: ${data.error || 'Failed to start session'}`);
            term.writeln('\r\nPlease check Docker settings and try again.');
          }
          break;
        case 'exit':
          term.writeln('\r\n\r\n[Process exited]');
          setSessionStarted(false);
          sessionStartedRef.current = false;
          break;
      }
    };

    websocket.onclose = () => {
      setConnected(false);
      setSessionStarted(false);
      sessionStartedRef.current = false;
      term.writeln('\r\n\r\n❌ Disconnected from server');
    };

    websocket.onerror = (error) => {
      term.writeln('\r\n❌ Connection error');
    };

    setWs(websocket);

    // Terminal input handler
    term.onData((data) => {
      if (websocket.readyState === WebSocket.OPEN && sessionStartedRef.current) {
        websocket.send(JSON.stringify({
          type: 'input',
          data: data
        }));
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      websocket.close();
    };
  };

  const startSession = () => {
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'start'
      }));
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Claude Code Terminal</h1>
        <p>Interactive AI coding assistant</p>
      </header>
      
      <div className="controls">
        <button 
          onClick={startSession} 
          disabled={!connected || sessionStarted}
          className="start-button"
        >
          {sessionStarted ? '✅ Session Active' : '🚀 Start Session'}
        </button>
        
        <div className="status">
          Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="terminal-container">
        <div 
          ref={terminalRef} 
          className="terminal" 
          onClick={() => terminal?.focus()}
          style={{ cursor: 'text' }}
        />
      </div>
    </div>
  );
}

export default TerminalApp;