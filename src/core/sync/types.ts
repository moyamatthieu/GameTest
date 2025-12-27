import * as THREE from 'three';

export interface VesselState {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number }; // Quaternion
}

export interface RemotePlayer {
  peerId: string;
  state: VesselState;
  lastUpdate: number;
  object?: THREE.Object3D;
}
