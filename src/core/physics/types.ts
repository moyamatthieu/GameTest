import * as THREE from 'three';

export interface InputState {
  forward: boolean;    // W
  backward: boolean;   // S
  left: boolean;       // A (Yaw Left)
  right: boolean;      // D (Yaw Right)
  up: boolean;         // R (Pitch Up)
  down: boolean;       // F (Pitch Down)
  rollLeft: boolean;   // Q
  rollRight: boolean;  // E
  brake: boolean;      // Space
  boost: boolean;      // Shift
  fire: boolean;       // Ctrl or Left Click
}

export interface PhysicsComponent {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  acceleration: number;
  angularAcceleration: number;
  maxSpeed: number;
  maxAngularSpeed: number;
  drag: number;
  angularDrag: number;
}
