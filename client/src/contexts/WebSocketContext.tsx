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
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;
  const baseDelay = 1000; // 1 second

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCountRef.current = 0;
    setStatus('disconnected');
    setError(null);
  }, []);

  const attemptConnection = useCallback(async (): Promise<void> => {
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

      // Determine WebSocket URL based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      let wsUrl;
      if (isProduction) {
        // In production, check if we have specific WebSocket configuration
        const wsHost = process.env.REACT_APP_WS_HOST || window.location.hostname;
        const wsPort = process.env.REACT_APP_WS_PORT;
        
        if (wsPort) {
          // Explicit WebSocket port specified
          wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;
        } else {
          // No explicit port - assume WebSocket is proxied through the same domain
          // This is common in production deployments where reverse proxy handles routing
          wsUrl = `${wsProtocol}//${wsHost}`;
        }
      } else {
        // In development, always use localhost with the configured port
        wsUrl = `ws://localhost:${configRes.wsPort}`;
      }
      
      console.log('WebSocket connecting to:', wsUrl, { 
        isProduction, 
        hostname: window.location.hostname,
        attempt: retryCountRef.current + 1 
      });

      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const cleanup = () => {
          ws.onopen = null;
          ws.onmessage = null;
          ws.onerror = null;
          ws.onclose = null;
        };

        ws.onopen = () => {
          console.log('WebSocket connected, sending auth...');
          retryCountRef.current = 0; // Reset retry count on successful connection
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
              cleanup();
              resolve();
            } else {
              const error = new Error(data.error || 'Authentication failed');
              setError(error.message);
              setStatus('error');
              cleanup();
              ws.close();
              reject(error);
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
          cleanup();
          reject(error);
        };

        ws.onclose = () => {
          setStatus('disconnected');
          wsRef.current = null;
          cleanup();
          reject(new Error('WebSocket closed unexpectedly'));
        };
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setError(error.message);
      setStatus('error');
      throw error;
    }
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    // Prevent multiple connections
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return Promise.resolve();
    }

    if (status === 'connecting') {
      console.log('WebSocket connection already in progress');
      // Return the existing promise if one is waiting
      return new Promise((resolve, reject) => {
        const checkStatus = () => {
          if (status === 'authenticated') {
            resolve();
          } else if (status === 'error' || status === 'disconnected') {
            reject(new Error('Connection failed'));
          } else {
            // Still connecting, check again in 100ms
            setTimeout(checkStatus, 100);
          }
        };
        checkStatus();
      });
    }

    setStatus('connecting');
    setError(null);

    return new Promise(async (resolve, reject) => {
      connectPromiseRef.current = { resolve, reject };

      const tryConnect = async (): Promise<void> => {
        try {
          await attemptConnection();
          connectPromiseRef.current?.resolve();
          connectPromiseRef.current = null;
        } catch (error) {
          console.error(`Connection attempt ${retryCountRef.current + 1} failed:`, error);
          
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            const delay = baseDelay * Math.pow(2, retryCountRef.current - 1);
            console.log(`Retrying in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
            
            retryTimeoutRef.current = setTimeout(tryConnect, delay);
          } else {
            setError(`Failed to connect after ${maxRetries} attempts`);
            setStatus('error');
            const errorObj = error instanceof Error ? error : new Error('Connection failed');
            connectPromiseRef.current?.reject(errorObj);
            connectPromiseRef.current = null;
          }
        }
      };

      tryConnect();
    });
  }, [status, attemptConnection]);

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