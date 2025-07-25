import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type WebSocketStatus = 'disconnected' | 'connecting' | 'authenticated' | 'session-started' | 'error';

interface WebSocketContextType {
  status: WebSocketStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (data: any) => void;
  onMessage: (handler: (data: any) => void) => void;
  offMessage: (handler: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const messageHandlersRef = useRef<Set<(data: any) => void>>(new Set());
  const connectPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setError(null);
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    // Prevent multiple connections
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    if (status === 'connecting') {
      console.log('WebSocket connection already in progress');
      return new Promise((resolve, reject) => {
        connectPromiseRef.current = { resolve, reject };
      });
    }

    setStatus('connecting');
    setError(null);

    return new Promise(async (resolve, reject) => {
      connectPromiseRef.current = { resolve, reject };

      try {
        // Get config and auth token
        const [configRes, sessionData] = await Promise.all([
          fetch('/api/config').then(res => res.json()).catch(() => ({ wsPort: 8081 })),
          supabase.auth.getSession()
        ]);

        const { session } = sessionData.data;
        if (!session?.access_token) {
          throw new Error('No authentication token found');
        }

        const ws = new WebSocket(`ws://localhost:${configRes.wsPort}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected, sending auth...');
          ws.send(JSON.stringify({
            type: 'auth',
            token: session.access_token,
            user: {
              id: session.user.id,
              email: session.user.email
            }
          }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          // Handle authentication response
          if (data.type === 'auth') {
            if (data.status === 'authenticated') {
              setStatus('authenticated');
              connectPromiseRef.current?.resolve();
              connectPromiseRef.current = null;
            } else {
              const error = new Error(data.error || 'Authentication failed');
              setError(error.message);
              setStatus('error');
              connectPromiseRef.current?.reject(error);
              connectPromiseRef.current = null;
              ws.close();
            }
          }
          
          // Handle session status
          if (data.type === 'status') {
            if (data.status === 'started') {
              setStatus('session-started');
            } else if (data.status === 'error') {
              setError(data.error || 'Failed to start session');
            }
          }
          
          // Notify all message handlers
          messageHandlersRef.current.forEach(handler => handler(data));
        };

        ws.onerror = () => {
          const error = new Error('WebSocket connection error');
          setError(error.message);
          setStatus('error');
          connectPromiseRef.current?.reject(error);
          connectPromiseRef.current = null;
        };

        ws.onclose = () => {
          setStatus('disconnected');
          wsRef.current = null;
          
          // If we were still connecting, reject the promise
          if (connectPromiseRef.current) {
            connectPromiseRef.current.reject(new Error('WebSocket closed unexpectedly'));
            connectPromiseRef.current = null;
          }
        };

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to connect');
        setError(error.message);
        setStatus('error');
        connectPromiseRef.current?.reject(error);
        connectPromiseRef.current = null;
      }
    });
  }, [status]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send:', data);
    }
  }, []);

  const onMessage = useCallback((handler: (data: any) => void) => {
    messageHandlersRef.current.add(handler);
  }, []);

  const offMessage = useCallback((handler: (data: any) => void) => {
    messageHandlersRef.current.delete(handler);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    status,
    error,
    connect,
    disconnect,
    send,
    onMessage,
    offMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};