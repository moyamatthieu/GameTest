import * as THREE from 'three';

export type CommandType = 'MOVE' | 'ATTACK' | 'HARVEST' | 'STOP';

export interface SelectionState {
  selectedEntityIds: Set<string>;
  isSelecting: boolean;
  startPoint: THREE.Vector2;
}

export interface Command {
  id: string;
  issuer: string;
  signature: string;
  tick: number;
  type: CommandType;
  subjectIds: string[];
  targetPosition: THREE.Vector3;
  targetEntityId?: string;
}

export interface RTSCommand {
  issuer: string;
  signature: string;
  tick: number;
  sequence: number;
  type: CommandType;
  unitIds: string[];
  target: {
    x: number;
    y: number;
    z: number;
    entityId?: string;
  };
}
