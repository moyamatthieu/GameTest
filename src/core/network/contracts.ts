export interface P2PMessage {
  type: string;
  payload: any;
  timestamp: number;
  senderId: string;
  signature?: string;
}

export enum MessageType {
  HEARTBEAT = 'HEARTBEAT',
  CHAT = 'CHAT',
  STATE_UPDATE = 'STATE_UPDATE',
  FIRE_LASER = 'FIRE_LASER',
  HIT_TARGET = 'HIT_TARGET',
}

export interface FireLaserPayload {
  projectileId: string;
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  velocity: number;
}

export interface HitTargetPayload {
  projectileId: string;
  targetId: string;
  damage: number;
}

export interface ChatPayload {
  text: string;
}

export interface StateUpdatePayload {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
}
