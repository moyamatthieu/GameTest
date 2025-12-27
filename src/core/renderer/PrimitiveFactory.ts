import * as THREE from 'three';
import { IPrimitiveFactory } from './types';

export class PrimitiveFactory implements IPrimitiveFactory {
  public createBox(width: number, height: number, depth: number, color: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  public createSphere(radius: number, color: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  public createCone(radius: number, height: number, color: number): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(radius, height, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  public createShip(): THREE.Group {
    const ship = new THREE.Group();
    ship.name = 'modular-ship';

    // Hull (Box)
    const hull = this.createBox(1, 0.5, 2, 0x888888);
    ship.add(hull);

    // Cockpit (Sphere)
    const cockpit = this.createSphere(0.3, 0x00aaff);
    cockpit.position.set(0, 0.3, 0.5);
    ship.add(cockpit);

    // Nose (Cone)
    const nose = this.createCone(0.5, 1, 0xff0000);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 1.5);
    ship.add(nose);

    // Engines (Cylinders)
    const engineGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-0.4, 0, -1);
    ship.add(leftEngine);

    const rightEngine = new THREE.Mesh(engineGeo, engineMat);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(0.4, 0, -1);
    ship.add(rightEngine);

    return ship;
  }
}
