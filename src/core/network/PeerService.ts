import Peer, { DataConnection } from 'peerjs';
import { ConnectionStatus } from './types';

export class PeerService {
  private peer: Peer;
  private connections: Map<string, DataConnection> = new Map();
  private onConnectionCallback?: (conn: DataConnection) => void;
  private onStatusChangeCallback?: (status: ConnectionStatus) => void;

  constructor(peerId: string) {
    this.peer = new Peer(peerId);

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.peer.on('open', (id) => {
      console.log('PeerJS connection opened with ID:', id);
      this.onStatusChangeCallback?.('connected');
    });

    this.peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      this.handleIncomingConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      this.onStatusChangeCallback?.('error');
    });

    this.peer.on('disconnected', () => {
      console.log('PeerJS disconnected');
      this.onStatusChangeCallback?.('disconnected');
    });
  }

  private handleIncomingConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.onConnectionCallback?.(conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  connect(targetPeerId: string): void {
    if (this.connections.has(targetPeerId)) return;

    const conn = this.peer.connect(targetPeerId);
    this.handleIncomingConnection(conn);
  }

  onConnection(callback: (conn: DataConnection) => void) {
    this.onConnectionCallback = callback;
  }

  onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.onStatusChangeCallback = callback;
  }

  getPeerId(): string {
    return this.peer.id;
  }

  sendMessage(targetPeerId: string, message: any): void {
    const conn = this.connections.get(targetPeerId);
    if (conn && conn.open) {
      conn.send(message);
    } else {
      console.warn(`Cannot send message to ${targetPeerId}: connection not open`);
    }
  }

  disconnect() {
    this.peer.destroy();
  }
}
