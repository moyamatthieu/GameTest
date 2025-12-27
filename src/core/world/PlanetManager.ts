import * as THREE from 'three';
import { SceneManager } from '../renderer/SceneManager';
import { PlanetData } from './types';

export class PlanetManager {
  private planets: Map<string, THREE.Mesh> = new Map();

  constructor(private sceneManager: SceneManager) {}

  createPlanet(data: PlanetData) {
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.8,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `planet-${data.id}`;

    // Add a simple ring if it's a gas giant (randomly or based on type)
    if (data.type === 'gas' && Math.random() > 0.5) {
      const ringGeo = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.2, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: data.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    }

    this.sceneManager.addObject(mesh);
    this.planets.set(data.id, mesh);
    return mesh;
  }

  createStar(type: string) {
    const colors = {
      yellow: 0xffff00,
      blue: 0x00ffff,
      red: 0xff0000,
      white_dwarf: 0xffffff,
    };
    const color = (colors as any)[type] || 0xffff00;

    const geometry = new THREE.SphereGeometry(50, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'system-star';

    // Add a glow effect (simple)
    const light = new THREE.PointLight(color, 2, 2000);
    mesh.add(light);

    this.sceneManager.addObject(mesh);
    return mesh;
  }

  updatePlanetPosition(id: string, position: THREE.Vector3) {
    const mesh = this.planets.get(id);
    if (mesh) {
      mesh.position.copy(position);
    }
  }

  clearPlanets() {
    this.planets.forEach((mesh, id) => {
      this.sceneManager.removeObject(mesh.name);
    });
    this.planets.clear();
    this.sceneManager.removeObject('system-star');
  }

  getPlanetMesh(id: string): THREE.Mesh | undefined {
    return this.planets.get(id);
  }
}
