import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import TerminalApp from './TerminalApp';
import './App.css';

// Example of how to wrap your app with AuthProvider
function App() {
  return (
    <AuthProvider>
      <TerminalApp />
    </AuthProvider>
  );
}

export default App;