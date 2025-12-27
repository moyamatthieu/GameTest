import * as THREE from 'three';
import { World } from '../World';
import { Selectable } from '../components/Selectable';
import { Renderable } from '../components/Renderable';
import { Position } from '../components/Position';
import { Owner } from '../components/Owner';
import { System } from '../System';

export class SelectionSystem implements System {
  private raycaster: THREE.Raycaster;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
  }

  public selectAt(mousePos: { x: number, y: number }, world: World, multiSelect: boolean = false) {
    this.raycaster.setFromCamera(mousePos, this.camera);

    // Get all renderable meshes that are also selectable
    const selectableEntities = world.getEntitiesWith(Selectable, Renderable);
    const meshes: THREE.Object3D[] = [];
    const meshToEntity = new Map<number, number>();

    for (const entity of selectableEntities) {
      const renderable = world.getComponent(entity, Renderable)!;
      meshes.push(renderable.mesh);
      meshToEntity.set(renderable.mesh.id, entity);
    }

    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      // Find the first intersected object that maps to an entity
      for (const intersect of intersects) {
        let obj: THREE.Object3D | null = intersect.object;
        // Traverse up to find the root mesh that we registered
        while (obj) {
          if (meshToEntity.has(obj.id)) {
            const entity = meshToEntity.get(obj.id)!;
            const sel = world.getComponent(entity, Selectable)!;
            sel.selected = true;
            return; // Select only top one
          }
          obj = obj.parent;
        }
      }
    }
  }

  public selectBox(start: { x: number, y: number }, end: { x: number, y: number }, world: World, myPlayerId: string | null) {
    const selectableEntities = world.getEntitiesWith(Selectable, Renderable, Position, Owner);

    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    for (const entity of selectableEntities) {
      const sel = world.getComponent(entity, Selectable)!;
      const owner = world.getComponent(entity, Owner)!;
      const pos = world.getComponent(entity, Position)!;

      // Project 3D position to screen space
      const vector = new THREE.Vector3(pos.x, pos.y, pos.z);
      vector.project(this.camera);

      // Convert to screen coordinates (0 to window size)
      const screenX = (vector.x + 1) / 2 * window.innerWidth;
      const screenY = (-(vector.y - 1) / 2) * window.innerHeight;

      if (owner.playerId === myPlayerId &&
          screenX >= minX && screenX <= maxX &&
          screenY >= minY && screenY <= maxY) {
        sel.selected = true;
      }
    }
  }

  update(world: World, delta: number): void {
    // Selection logic is event based, update might be unused or for hover effects
  }
}
