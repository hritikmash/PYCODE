import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer, IncomingMessage } from 'http';
import { verifySession, recordHeartbeat, OWNER_EMAIL } from './authService.ts';

export interface AuthenticatedClient {
  ws: WebSocket;
  userId?: string;
  userEmail?: string;
  role?: string;
  token?: string;
  deviceId?: string;
  isAlive: boolean;
  isAdminSubscriber: boolean;
}

const clients = new Set<AuthenticatedClient>();
let wssInstance: WebSocketServer | null = null;

export function setupWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  wssInstance = wss;

  httpServer.on('upgrade', (request: IncomingMessage, socket: any, head: any) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws' || url.pathname === '/ws/') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.warn('WebSocket upgrade check warning:', err);
    }
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const client: AuthenticatedClient = {
      ws,
      isAlive: true,
      isAdminSubscriber: false
    };

    clients.add(client);

    // Initial welcome payload with server timestamp
    ws.send(JSON.stringify({
      type: 'connection:ready',
      timestamp: Date.now(),
      message: 'Connected to Pycode WebSocket service'
    }));

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('message', (data: any) => {
      try {
        const messageStr = typeof data === 'string' ? data : data.toString('utf-8');
        const parsed = JSON.parse(messageStr);

        switch (parsed.type) {
          case 'auth': {
            const { token, deviceId } = parsed;
            client.deviceId = deviceId;
            if (token) {
              const verifiedUser = verifySession(token);
              if (verifiedUser) {
                client.token = token;
                client.userId = verifiedUser.id;
                client.userEmail = verifiedUser.email;
                client.role = verifiedUser.role;
                client.isAdminSubscriber = verifiedUser.role === 'owner' || verifiedUser.role === 'admin';

                // Record immediate heartbeat
                recordHeartbeat(token);

                ws.send(JSON.stringify({
                  type: 'auth:success',
                  user: verifiedUser,
                  deviceId,
                  timestamp: Date.now()
                }));

                // Broadcast presence update to admins
                broadcastAdminUpdate('presence:join', {
                  userId: verifiedUser.id,
                  email: verifiedUser.email,
                  deviceId,
                  role: verifiedUser.role
                });
              } else {
                ws.send(JSON.stringify({
                  type: 'auth:error',
                  error: 'Session invalid or expired'
                }));
              }
            }
            break;
          }

          case 'ping': {
            client.isAlive = true;
            if (client.token) {
              recordHeartbeat(client.token);
            }
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          }

          case 'heartbeat': {
            client.isAlive = true;
            if (client.token) {
              recordHeartbeat(client.token);
            }
            ws.send(JSON.stringify({ type: 'heartbeat:ack', timestamp: Date.now() }));
            break;
          }

          case 'subscribe:admin': {
            if (client.role === 'owner' || client.role === 'admin') {
              client.isAdminSubscriber = true;
              ws.send(JSON.stringify({
                type: 'admin:subscribed',
                timestamp: Date.now()
              }));
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.warn('Failed to parse WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(client);
      if (client.userEmail) {
        broadcastAdminUpdate('presence:leave', {
          userId: client.userId,
          email: client.userEmail,
          deviceId: client.deviceId
        });
      }
    });

    ws.on('error', (err) => {
      console.warn('WebSocket connection error:', err?.message || err);
      clients.delete(client);
    });
  });

  // Keep-alive heartbeat interval every 30 seconds
  const interval = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(client);
        continue;
      }
      client.isAlive = false;
      client.ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('Real-time WebSocket service initialized on /ws');
  return wss;
}

/**
 * Broadcast an event to all connected admin/owner sockets.
 */
export function broadcastAdminUpdate(eventType: string, data?: any) {
  const payload = JSON.stringify({
    type: 'admin:event',
    eventType,
    data,
    timestamp: Date.now()
  });

  for (const client of clients) {
    if (client.isAdminSubscriber && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

/**
 * Broadcast session revocation to force instant logout on affected sockets.
 */
export function broadcastSessionRevocation(targetSessionId: string, targetUserId?: string) {
  const payload = JSON.stringify({
    type: 'session:revoked',
    sessionId: targetSessionId,
    userId: targetUserId,
    timestamp: Date.now()
  });

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (!targetUserId || client.userId === targetUserId) {
        client.ws.send(payload);
      }
    }
  }
}

/**
 * Broadcast user-wide logout (e.g. logout-all) to all sockets of that user.
 */
export function broadcastUserLogout(targetUserId: string) {
  const payload = JSON.stringify({
    type: 'auth:force_logout',
    userId: targetUserId,
    timestamp: Date.now()
  });

  for (const client of clients) {
    if (client.userId === targetUserId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

/**
 * Broadcast a system notification or update to all active clients.
 */
export function broadcastSystemMessage(message: string, level: 'info' | 'warning' = 'info') {
  const payload = JSON.stringify({
    type: 'system:notification',
    message,
    level,
    timestamp: Date.now()
  });

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}
