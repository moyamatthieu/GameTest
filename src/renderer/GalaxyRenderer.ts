import * as THREE from 'three';
import { UniverseState } from '../core/world/types';

export class GalaxyRenderer {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
  }

  public update(universe: UniverseState): THREE.Group {
    this.group.clear();

    const cubeSize = 100; // Size of each cube
    const gridSize = 10; // 10x10 grid

    // Create 10x10 cubes
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        // Create wireframe cube
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const edges = new THREE.EdgesGeometry(cubeGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);

        // Position cube (centered at origin)
        const posX = (x - gridSize / 2 + 0.5) * cubeSize;
        const posZ = (z - gridSize / 2 + 0.5) * cubeSize;
        wireframe.position.set(posX, 0, posZ);
        wireframe.name = `cube-${x}-${z}`;
        this.group.add(wireframe);

        // Add 10 random stars per cube
        for (let i = 0; i < 10; i++) {
          const starGeometry = new THREE.SphereGeometry(1, 8, 8);
          const starMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8
          });
          const star = new THREE.Mesh(starGeometry, starMaterial);

          // Random position within cube bounds
          const randX = posX + (Math.random() - 0.5) * cubeSize * 0.8;
          const randY = (Math.random() - 0.5) * cubeSize * 0.8;
          const randZ = posZ + (Math.random() - 0.5) * cubeSize * 0.8;
          star.position.set(randX, randY, randZ);
          star.name = `star-${x}-${z}-${i}`;
          this.group.add(star);
        }
      }
    }

    return this.group;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }
}
