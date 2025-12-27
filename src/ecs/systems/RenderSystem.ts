import { System } from '../System';
import { World } from '../World';
import { Position } from '../components/Position';
import { Renderable } from '../components/Renderable';
import { Selectable } from '../components/Selectable';
import { Harvester, HarvesterState } from '../components/Harvester';
import { Inventory } from '../components/Inventory';
import * as THREE from 'three';

export class RenderSystem implements System {
  private scene: THREE.Scene;
  private selectionRingGeo: THREE.RingGeometry;
  private selectionRingMat: THREE.MeshBasicMaterial;
  private cargoBoxGeo: THREE.BoxGeometry;
  private cargoBoxMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.selectionRingGeo = new THREE.RingGeometry(0.6, 0.7, 32);
    this.selectionRingMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    this.selectionRingGeo.rotateX(-Math.PI / 2);

    this.cargoBoxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    this.cargoBoxMat = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow for cargo
  }

  update(world: World, delta: number): void {
    const entities = world.getEntitiesWith(Position, Renderable);

    for (const entity of entities) {
      const position = world.getComponent(entity, Position)!;
      const renderable = world.getComponent(entity, Renderable)!;

      // Sync position
      renderable.mesh.position.set(position.x, position.y, position.z);

      // Handle selection visual
      const selectable = world.getComponent(entity, Selectable);
      if (selectable) {
        let ring = renderable.mesh.getObjectByName('selectionRing');

        if (selectable.selected) {
          if (!ring) {
            ring = new THREE.Mesh(this.selectionRingGeo, this.selectionRingMat);
            ring.name = 'selectionRing';
            ring.position.y = -0.45; // At the base of the unit
            renderable.mesh.add(ring);
          }
        } else {
          if (ring) {
            renderable.mesh.remove(ring);
          }
        }
      }

      // Handle Harvesting/Depositing Visual (Pulsing)
      const harvester = world.getComponent(entity, Harvester);
      if (harvester) {
        if (harvester.state === HarvesterState.HARVESTING) {
          const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
          renderable.mesh.scale.set(scale, scale, scale);
        } else if (harvester.state === HarvesterState.DEPOSITING) {
          const scale = 1 + Math.sin(Date.now() * 0.02) * 0.1; // Faster pulse for depositing
          renderable.mesh.scale.set(scale, scale, scale);
        } else {
          renderable.mesh.scale.set(1, 1, 1);
        }
      } else {
        renderable.mesh.scale.set(1, 1, 1);
      }

      // Handle Inventory Visual (Small box on top)
      const inventory = world.getComponent(entity, Inventory);
      if (inventory) {
        let cargo = renderable.mesh.getObjectByName('cargoVisual');
        if (inventory.currentLoad() > 0) {
          if (!cargo) {
            cargo = new THREE.Mesh(this.cargoBoxGeo, this.cargoBoxMat);
            cargo.name = 'cargoVisual';
            cargo.position.y = 0.7; // On top of the unit
            renderable.mesh.add(cargo);
          }
        } else {
          if (cargo) {
            renderable.mesh.remove(cargo);
          }
        }
      }
    }
  }
}
