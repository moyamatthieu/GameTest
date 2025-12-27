import { ProjectileManager } from '../../core/combat/ProjectileManager';
import { CollisionSystem } from '../../core/physics/CollisionSystem';
import * as THREE from 'three';

export class ProjectileSystem {
  private projectileManager: ProjectileManager;
  private collisionSystem: CollisionSystem;
  private onHitCallback?: (projectileId: string, targetId: string) => void;

  constructor(projectileManager: ProjectileManager, collisionSystem: CollisionSystem) {
    this.projectileManager = projectileManager;
    this.collisionSystem = collisionSystem;
  }

  public onHit(callback: (projectileId: string, targetId: string) => void): void {
    this.onHitCallback = callback;
  }

  public update(deltaTime: number, targets: THREE.Object3D[]): void {
    const projectiles = this.projectileManager.getProjectiles();

    for (const p of projectiles) {
      p.lifeTime -= deltaTime;
      if (p.lifeTime <= 0) {
        this.projectileManager.removeProjectile(p.id);
        continue;
      }

      const moveStep = p.velocity.clone().multiplyScalar(deltaTime);
      const nextPosition = p.position.clone().add(moveStep);

      // Check for collisions
      const hit = this.collisionSystem.checkHit(
        p.position,
        p.velocity.clone().normalize(),
        moveStep.length(),
        targets
      );

      if (hit) {
        console.log(`Projectile ${p.id} hit ${hit.object.name}`);
        this.onHitCallback?.(p.id, hit.object.name);
        this.projectileManager.removeProjectile(p.id);
      } else {
        p.position.copy(nextPosition);
        if (p.mesh) {
          p.mesh.position.copy(p.position);
        }
      }
    }
  }
}
