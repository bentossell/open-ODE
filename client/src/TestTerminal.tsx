import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export const TestTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Absolutely minimal xterm setup
    const term = new Terminal();
    const fitAddon = new FitAddon();
    
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Write a test message
    term.writeln('Test Terminal - xterm is working!');
    term.writeln('Type anything to test input...');

    // Handle input
    term.onData((data) => {
      term.write(data);
    });

    // Cleanup
    return () => {
      term.dispose();
    };
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      fontFamily: 'monospace'
    }}>
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
        Test Terminal - Check if xterm basic functionality works
      </div>
      <div 
        ref={terminalRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 40px)',
          backgroundColor: '#000'
        }} 
      />
    </div>
  );
};