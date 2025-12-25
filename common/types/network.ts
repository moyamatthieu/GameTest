import { Entity } from './ecs';

/**
 * Types de messages circulant sur le réseau
 */
export enum MessageType {
  AUTH = 'AUTH',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  SYNC_STATE = 'SYNC_STATE',
  INPUT_COMMAND = 'INPUT_COMMAND',
  ERROR = 'ERROR',
  PING = 'PING',
  PONG = 'PONG'
}

/**
 * Interface de base pour un message réseau
 */
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
}

/**
 * Message d'authentification
 */
export interface AuthMessage extends BaseMessage {
  type: MessageType.AUTH;
  payload: {
    token: string;
    userId: string;
  };
}

/**
 * Message de succès d'authentification
 */
export interface AuthSuccessMessage extends BaseMessage {
  type: MessageType.AUTH_SUCCESS;
  payload: {
    playerId: string;
    worldState: Snapshot;
  };
}

/**
 * Message de synchronisation d'état (Snapshot)
 */
export interface SyncStateMessage extends BaseMessage {
  type: MessageType.SYNC_STATE;
  payload: Snapshot;
}

/**
 * Message de commande d'entrée utilisateur
 */
export interface InputCommandMessage extends BaseMessage {
  type: MessageType.INPUT_COMMAND;
  payload: {
    command: string;
    params: any;
    sequenceNumber: number;
  };
}

/**
 * Message d'erreur
 */
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  payload: {
    code: string;
    message: string;
  };
}

/**
 * Message de Ping
 */
export interface PingMessage extends BaseMessage {
  type: MessageType.PING;
  payload: {
    id: number;
  };
}

/**
 * Message de Pong
 */
export interface PongMessage extends BaseMessage {
  type: MessageType.PONG;
  payload: {
    id: number;
  };
}

/**
 * Union de tous les messages possibles (Discriminated Union)
 */
export type GameMessage =
  | AuthMessage
  | AuthSuccessMessage
  | SyncStateMessage
  | InputCommandMessage
  | ErrorMessage
  | PingMessage
  | PongMessage;

/**
 * Interface pour le Snapshot d'état du jeu
 */
export interface Snapshot {
  tick: number;
  timestamp: number;
  entities: EntityState[];
}

/**
 * État d'une entité dans un snapshot
 */
export interface EntityState {
  id: Entity;
  components: {
    [componentName: string]: any;
  };
}
