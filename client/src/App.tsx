import React from 'react';
import ChatApp from './ChatApp';
import { WebSocketProvider } from './contexts/WebSocketContext';
import './App.css';

function App() {
  return (
    <WebSocketProvider>
      <ChatApp />
    </WebSocketProvider>
  );
}

export default App;