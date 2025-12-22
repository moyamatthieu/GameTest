import * as THREE from 'three';
import { MAP_OBSTACLES } from 'shared';

export class GameMap {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  private init() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid helper for visual reference
    const gridHelper = new THREE.GridHelper(100, 50, 0x888888, 0x444444);
    this.scene.add(gridHelper);

    // Obstacles from shared data
    for (const obs of MAP_OBSTACLES) {
      this.createObstacle(obs.x, obs.y, obs.z, obs.w, obs.h, obs.d, obs.color);
    }
  }

  private createObstacle(x: number, y: number, z: number, w: number, h: number, d: number, color: number) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }
}
