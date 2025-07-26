import React from 'react';
import './index.css';
import TerminalApp from './TerminalApp';
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  return (
    <WebSocketProvider>
      <TerminalApp />
    </WebSocketProvider>
  );
}

export default App;
