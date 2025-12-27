import * as THREE from 'three';
import { Projectile } from './types';
import { SceneManager } from '../renderer/SceneManager';

export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map();
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  public createProjectile(
    id: string,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    lifeTime: number,
    ownerId: string
  ): Projectile {
    const velocity = direction.clone().normalize().multiplyScalar(speed);

    // Create laser mesh
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    geometry.rotateX(Math.PI / 2); // Align with Z axis
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = id;

    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction.clone().normalize());

    this.sceneManager.addObject(mesh);

    const projectile: Projectile = {
      id,
      position: origin.clone(),
      velocity,
      ownerId,
      damage: 10,
      lifeTime,
      mesh,
    };

    this.projectiles.set(id, projectile);
    return projectile;
  }

  public removeProjectile(id: string): void {
    const projectile = this.projectiles.get(id);
    if (projectile) {
      this.sceneManager.removeObject(id);
      this.projectiles.delete(id);
    }
  }

  public getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values());
  }
}
