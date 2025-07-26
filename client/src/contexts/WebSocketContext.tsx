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
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();

      const { session } = sessionData;
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      // Build WebSocket URL from current location (same origin)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
      
      console.log('WebSocket connecting to:', wsUrl, { 
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
          
          // Set a timeout to warn if auth doesn't complete
          const authTimeout = setTimeout(() => {
            console.warn('⚠️ WebSocket auth is taking longer than expected (5s)');
            setError('Authentication timeout - please refresh the page');
          }, 5000);
          
          ws.send(JSON.stringify({
            type: 'auth',
            token: session.access_token,
            user: {
              id: session.user.id,
              email: session.user.email
            }
          }));
          
          // Store timeout to clear it on auth success
          (ws as any).authTimeout = authTimeout;
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          // Handle authentication response
          if (data.type === 'auth') {
            // Clear auth timeout
            if ((ws as any).authTimeout) {
              clearTimeout((ws as any).authTimeout);
            }
            
            if (data.status === 'authenticated') {
              console.log('✅ WebSocket authenticated successfully');
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

        ws.onerror = (event) => {
          console.error('❌ WebSocket error:', event);
          const error = new Error('WebSocket connection error - check console for details');
          setError(error.message);
          setStatus('error');
          cleanup();
          reject(error);
        };

        ws.onclose = (event) => {
          console.warn('WebSocket closed:', { code: event.code, reason: event.reason });
          setStatus('disconnected');
          wsRef.current = null;
          cleanup();
          
          // Clear auth timeout if still active
          if ((ws as any).authTimeout) {
            clearTimeout((ws as any).authTimeout);
          }
          
          const errorMsg = event.reason || `WebSocket closed unexpectedly (code: ${event.code})`;
          setError(errorMsg);
          reject(new Error(errorMsg));
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
    // If socket is already open and authenticated, return immediately
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      (status === 'authenticated' || status === 'session-started')
    ) {
      console.log('WebSocket already authenticated');
      return;
    }

    // If a connection is in progress or open but not yet authenticated, wait
    if (
      (wsRef.current &&
        (wsRef.current.readyState === WebSocket.CONNECTING ||
          wsRef.current.readyState === WebSocket.OPEN)) ||
      status === 'connecting'
    ) {
      console.log('Waiting for existing WebSocket authentication');
      return new Promise<void>((resolve, reject) => {
        const handler = (data: any) => {
          if (data.type === 'auth') {
            messageHandlersRef.current.delete(handler);
            if (data.status === 'authenticated') {
              resolve();
            } else {
              reject(new Error(data.error || 'Authentication failed'));
            }
          }
        };
        messageHandlersRef.current.add(handler);
      });
    }

    setStatus('connecting');
    setError(null);
    retryCountRef.current = 0;

    try {
      await attemptConnection();
    } catch (error) {
      console.error('Initial connection failed:', error);
      
      // Simple retry logic
      for (let i = 0; i < maxRetries; i++) {
        retryCountRef.current = i + 1;
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          await attemptConnection();
          return; // Success!
        } catch (retryError) {
          console.error(`Retry ${i + 1} failed:`, retryError);
          if (i === maxRetries - 1) {
            setError(`Failed to connect after ${maxRetries} attempts`);
            setStatus('error');
            throw retryError;
          }
        }
      }
    }
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