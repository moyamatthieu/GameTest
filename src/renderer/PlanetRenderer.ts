import * as THREE from 'three';
import { PlanetData } from '../core/world/types';

export class PlanetRenderer {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
  }

  public update(planet: PlanetData, heightmapData?: Float32Array): THREE.Group {
    this.group.clear();

    // Render Planet Surface
    const geometry = new THREE.SphereGeometry(planet.radius, 128, 128);

    if (heightmapData) {
      // Apply heightmap to vertices
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);

        // Simplified heightmap application
        const height = heightmapData[i % heightmapData.length];
        const factor = 1 + height * 0.1;
        positions.setXYZ(i, x * factor, y * factor, z * factor);
      }
      geometry.computeVertexNormals();
    }

    const material = new THREE.MeshPhongMaterial({
      color: planet.color,
      flatShading: heightmapData ? true : false
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.group.add(mesh);

    // Render Space Grid (Principle II)
    const gridRadius = planet.radius * 2;
    const gridHelper = new THREE.GridHelper(gridRadius * 2, 20, 0x444444, 0x222222);
    this.group.add(gridHelper);

    return this.group;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }
}
