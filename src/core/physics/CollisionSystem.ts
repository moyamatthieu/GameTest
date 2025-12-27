import * as THREE from 'three';

export class CollisionSystem {
  private raycaster: THREE.Raycaster;

  constructor() {
    this.raycaster = new THREE.Raycaster();
  }

  public checkHit(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    distance: number,
    targets: THREE.Object3D[]
  ): THREE.Intersection | null {
    this.raycaster.set(origin, direction.normalize());
    this.raycaster.far = distance;

    const intersections = this.raycaster.intersectObjects(targets, true);
    return intersections.length > 0 ? intersections[0] : null;
  }
}
