import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  send: (payload: any) => void;
  lastMessage: WebSocketEvent | null;
  subscribeToAdminEvents: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, deviceId, user, logout } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);

        // Authenticate immediately if token exists
        const currentToken = localStorage.getItem('pycode_viewer_auth_token') || token;
        if (currentToken) {
          ws.send(JSON.stringify({
            type: 'auth',
            token: currentToken,
            deviceId
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);

          // Real-time remote session revocation / forced logout
          if (data.type === 'auth:force_logout') {
            logout();
          }
        } catch (err) {
          console.warn('WebSocket message parse warning:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Resilient auto-reconnect
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    } catch (err) {
      console.warn('Failed to initialize WebSocket client:', err);
    }
  }, [token, deviceId, logout]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Periodic heartbeat over WebSocket every 25 seconds
  useEffect(() => {
    if (!isConnected) return;

    heartbeatTimerRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    }, 25000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isConnected]);

  // Re-send auth whenever token changes
  useEffect(() => {
    if (isConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN && token) {
      socketRef.current.send(JSON.stringify({
        type: 'auth',
        token,
        deviceId
      }));
    }
  }, [token, isConnected, deviceId]);

  const send = useCallback((payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
  }, []);

  const subscribeToAdminEvents = useCallback(() => {
    send({ type: 'subscribe:admin' });
  }, [send]);

  return (
    <WebSocketContext.Provider value={{ isConnected, send, lastMessage, subscribeToAdminEvents }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
