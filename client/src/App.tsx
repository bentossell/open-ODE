import React from 'react';
import AppLayout from './components/AppLayout';
import { WebSocketProvider } from './contexts/WebSocketContext';
import './App.css';

function App() {
  return (
    <WebSocketProvider>
      {/* Replace with new UI layout */}
      <AppLayout />
    </WebSocketProvider>
  );
}

export default App;