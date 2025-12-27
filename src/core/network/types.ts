export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface PeerConnection {
  remotePeerId: string;
  status: ConnectionStatus;
  lastSeen: number;
}
