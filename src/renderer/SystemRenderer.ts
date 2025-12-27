import * as THREE from 'three';
import { SystemData } from '../core/world/types';

export class SystemRenderer {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
  }

  public update(system: SystemData): THREE.Group {
    this.group.clear();

    // Render Star
    const starGeometry = new THREE.SphereGeometry(20, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    this.group.add(star);

    // Render Planets
    system.planets.forEach(planet => {
      const planetGeometry = new THREE.SphereGeometry(planet.radius, 32, 32);
      const planetMaterial = new THREE.MeshPhongMaterial({ color: planet.color });
      const mesh = new THREE.Mesh(planetGeometry, planetMaterial);

      // Position based on orbit
      mesh.position.set(planet.orbitDistance, 0, 0);
      this.group.add(mesh);

      // Render Orbit Line
      const orbitCurve = new THREE.EllipseCurve(0, 0, planet.orbitDistance, planet.orbitDistance);
      const points = orbitCurve.getPoints(64);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x444444 });
      const orbitLine = new THREE.Line(geometry, material);
      orbitLine.rotation.x = Math.PI / 2;
      this.group.add(orbitLine);
    });

    return this.group;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }
}
