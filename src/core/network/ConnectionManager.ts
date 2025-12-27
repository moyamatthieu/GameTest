import { DataConnection } from 'peerjs';
import { PeerConnection, ConnectionStatus } from './types';
import { P2PMessage, MessageType } from './contracts';

export class ConnectionManager {
  private connections: Map<string, PeerConnection> = new Map();
  private onMessageCallback?: (message: P2PMessage) => void;
  private onDisconnectCallback?: (peerId: string) => void;

  addConnection(conn: DataConnection) {
    const peerConn: PeerConnection = {
      remotePeerId: conn.peer,
      status: 'connected',
      lastSeen: Date.now(),
    };
    this.connections.set(conn.peer, peerConn);

    conn.on('data', (data) => {
      this.handleMessage(conn.peer, data as P2PMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.onDisconnectCallback?.(conn.peer);
    });
  }

  private handleMessage(peerId: string, message: P2PMessage) {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.lastSeen = Date.now();
    }
    this.onMessageCallback?.(message);
  }

  onMessage(callback: (message: P2PMessage) => void) {
    this.onMessageCallback = callback;
  }

  onDisconnect(callback: (peerId: string) => void) {
    this.onDisconnectCallback = callback;
  }

  getConnections(): PeerConnection[] {
    return Array.from(this.connections.values());
  }
}
