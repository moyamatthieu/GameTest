import * as THREE from 'three';

export interface ISceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;

  addObject(object: THREE.Object3D): void;
  removeObject(id: string): void;
  update(deltaTime: number): void;
  onResize(width: number, height: number): void;
}

export interface IPrimitiveFactory {
  createBox(width: number, height: number, depth: number, color: number): THREE.Mesh;
  createSphere(radius: number, color: number): THREE.Mesh;
  createShip(): THREE.Group;
}

export interface RenderInitPayload {
  canvas: HTMLCanvasElement;
}

export interface RenderErrorPayload {
  message: string;
}

export interface FrameUpdatePayload {
  deltaTime: number;
}

export enum CameraMode {
  CHASE = 'CHASE',
  COCKPIT = 'COCKPIT',
  ORBIT = 'ORBIT',
  RTS = 'RTS',
}

export interface CameraConfig {
  mode: CameraMode;
  offset: THREE.Vector3;
  lookAtOffset: THREE.Vector3;
  lerpFactor: number;
}
