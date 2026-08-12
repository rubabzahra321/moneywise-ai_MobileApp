const WebSocket = require('ws');

// ✅ Rewritten to use the plain 'ws' package instead of 'socket.io'.
//
// Why: the Flutter app connects with `web_socket_channel`'s
// IOWebSocketChannel.connect(wsUrl) — a raw WebSocket client. Socket.IO is
// NOT plain WebSocket: it wraps every message in its own Engine.IO
// handshake/framing protocol (e.g. messages look like `42["event",...]`
// and require an initial HTTP polling handshake before upgrading). A raw
// WebSocket client can open the TCP connection to a socket.io server, but
// it can't understand or produce that framing, so messages never actually
// get through — which is why "real-time" wasn't working even once the
// method names lined up on the Flutter side.
//
// This class keeps the same public API (initialize/sendToUser/sendToUsers/
// broadcastToAll) so nothing else in the backend needs to change.
class SocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // userId -> WebSocket instance
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws) => {
      console.log('🔌 New client connected');

      ws.on('message', (raw) => {
        let message;
        try {
          message = JSON.parse(raw);
        } catch (err) {
          console.error('❌ Invalid WebSocket message:', raw.toString());
          return;
        }

        // Matches the Flutter client's authenticate payload:
        // { 'event': 'authenticate', 'data': userId }
        if (message.event === 'authenticate') {
          const userId = message.data;
          ws.userId = userId;
          this.connections.set(userId, ws);
          console.log(`✅ User ${userId} authenticated for real-time updates`);

          ws.send(JSON.stringify({
            type: 'notification',
            type_category: 'system',
            title: 'Connected',
            body: 'You are now connected to real-time updates',
          }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.connections.delete(ws.userId);
          console.log(`❌ User ${ws.userId} disconnected`);
        }
      });

      ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err.message);
      });
    });

    return this.wss;
  }

  // Send notification to a specific user.
  // Envelope matches what the Flutter client's _handleWebSocketMessage
  // expects: a top-level "type": "notification" field, with the actual
  // notification's own category (transaction_added, budget_exceeded, etc.)
  // preserved on the payload for the UI to use.
  sendToUser(userId, notification) {
    const ws = this.connections.get(String(userId));
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = notification.toObject ? notification.toObject() : notification;
      ws.send(JSON.stringify({ type: 'notification', ...payload }));
      return true;
    }
    return false;
  }

  // Send to multiple users
  sendToUsers(userIds, notification) {
    const sent = [];
    for (const userId of userIds) {
      if (this.sendToUser(userId, notification)) {
        sent.push(userId);
      }
    }
    return sent;
  }

  // Broadcast to all connected users
  broadcastToAll(notification) {
    const payload = notification.toObject ? notification.toObject() : notification;
    for (const ws of this.connections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'notification', ...payload }));
      }
    }
  }
}

module.exports = new SocketService();