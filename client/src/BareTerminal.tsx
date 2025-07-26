import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const BareTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

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

    // Write initial message
    term.writeln('Welcome to Bare Terminal!');
    term.writeln('This is a minimal xterm.js implementation.');
    term.writeln('');
    term.write('$ ');

    // Handle input
    term.onData((data) => {
      // Echo the input back to terminal
      term.write(data);
      
      // Handle enter key
      if (data === '\r') {
        term.write('\n$ ');
      }
      
      // Handle backspace
      if (data === '\x7f') {
        term.write('\b \b');
      }
    });

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

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: '#1e1e1e',
      padding: '20px',
      boxSizing: 'border-box'
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
  );
};

export default BareTerminal;