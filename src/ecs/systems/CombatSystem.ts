import * as THREE from 'three';
import { ProjectileManager } from '../../core/combat/ProjectileManager';
import { WeaponComponent } from '../components/WeaponComponent';
import { MovementController } from '../../ui/input/MovementController';
import { FireLaserPayload } from '../../core/network/contracts';

export class CombatSystem {
  private projectileManager: ProjectileManager;
  private controller: MovementController;
  private peerId: string;
  private onFireCallback?: (payload: FireLaserPayload) => void;

  constructor(projectileManager: ProjectileManager, controller: MovementController, peerId: string) {
    this.projectileManager = projectileManager;
    this.controller = controller;
    this.peerId = peerId;
  }

  public onFire(callback: (payload: FireLaserPayload) => void) {
    this.onFireCallback = callback;
  }

  public update(object: THREE.Object3D, weapon: WeaponComponent): void {
    const input = this.controller.getInputState();

    if (input.fire && weapon.canFire()) {
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(object.quaternion);
      const origin = object.position.clone().add(direction.clone().multiplyScalar(2));

      const projectileId = `laser-${this.peerId}-${Date.now()}`;

      this.projectileManager.createProjectile(
        projectileId,
        origin,
        direction,
        weapon.projectileSpeed,
        weapon.projectileLifeTime,
        this.peerId
      );

      const payload: FireLaserPayload = {
        projectileId,
        origin: { x: origin.x, y: origin.y, z: origin.z },
        direction: { x: direction.x, y: direction.y, z: direction.z },
        velocity: weapon.projectileSpeed,
      };

      this.onFireCallback?.(payload);

      weapon.recordFire();
      console.log(`Fired laser: ${projectileId}`);
    }
  }
}
