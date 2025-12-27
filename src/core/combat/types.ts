import * as THREE from 'three';

export interface Projectile {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  ownerId: string;
  damage: number;
  lifeTime: number; // in seconds
  mesh?: THREE.Object3D;
}

export interface WeaponConfig {
  fireRate: number; // shots per second
  damage: number;
  projectileSpeed: number;
  projectileLifeTime: number;
  lastFireTime: number;
}

export interface HealthState {
  current: number;
  max: number;
  isDead: boolean;
}
