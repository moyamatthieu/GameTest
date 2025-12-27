import * as THREE from 'three';
import { World } from '../../ecs/World';
import { SelectableComponent } from '../../ecs/components/SelectableComponent';
import { SelectionState } from './types';
import { SpatialGrid } from '../utils/SpatialGrid';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionBox.js';

export class SelectionManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private world: World;
  private spatialGrid: SpatialGrid;
  private raycaster: THREE.Raycaster;
  private renderer: THREE.WebGLRenderer;
  private selectionBox: SelectionBox;
  private helper: SelectionHelper;
  public selectionState: SelectionState;

  constructor(camera: THREE.Camera, scene: THREE.Scene, world: World, spatialGrid: SpatialGrid, renderer?: THREE.WebGLRenderer) {
    this.camera = camera;
    this.scene = scene;
    this.world = world;
    this.spatialGrid = spatialGrid;
    this.raycaster = new THREE.Raycaster();
    if (renderer) {
      this.renderer = renderer;
      this.selectionBox = new SelectionBox(camera, scene);
      this.helper = new SelectionHelper(renderer, 'selectBox');
    }
    this.selectionState = {
      selectedEntityIds: new Set(),
      isSelecting: false,
      startPoint: new THREE.Vector2(),
    };
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement, shiftKey: boolean): void {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.selectionState.startPoint.set(x, y);
    this.selectionState.isSelecting = true;

    this.selectionBox.startPoint.set(x, y, 0.5);
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.selectionState.isSelecting) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.selectionBox.endPoint.set(x, y, 0.5);
    this.helper.update();
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement, shiftKey: boolean): void {
    if (!this.selectionState.isSelecting) return;

    this.selectionState.isSelecting = false;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Check if it's a drag (box selection) or click
    const distance = this.selectionState.startPoint.distanceTo(new THREE.Vector2(x, y));
    if (distance > 0.01) { // Threshold for drag
      // Box selection
      const selectedObjects = this.selectionBox.select();
      const selectedEntityIds = selectedObjects
        .map(obj => this.findSelectableEntity(obj))
        .filter(id => id !== null) as string[];

      if (!shiftKey) {
        this.clearSelection();
      }
      for (const entityId of selectedEntityIds) {
        this.selectEntity(entityId);
      }
    } else {
      // Single click
      this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      if (!shiftKey) {
        this.clearSelection();
      }

      for (const intersect of intersects) {
        const entityId = this.findSelectableEntity(intersect.object);
        if (entityId) {
          this.selectEntity(entityId);
          break;
        }
      }
    }

    this.helper.dispose();
  }

  private findSelectableEntity(object: THREE.Object3D): string | null {
    // Traverse up to find the root object that has entityId
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData.entityId) {
        const entityId = current.userData.entityId as string;
        const selectable = this.world.getComponent(parseInt(entityId), SelectableComponent);
        if (selectable) {
          return entityId;
        }
      }
      current = current.parent;
    }
    return null;
  }

  selectEntity(entityId: string): void {
    this.selectionState.selectedEntityIds.add(entityId);
    this.updateSelectableComponent(entityId, true);
  }

  deselectEntity(entityId: string): void {
    this.selectionState.selectedEntityIds.delete(entityId);
    this.updateSelectableComponent(entityId, false);
  }

  clearSelection(): void {
    for (const entityId of this.selectionState.selectedEntityIds) {
      this.updateSelectableComponent(entityId, false);
    }
    this.selectionState.selectedEntityIds.clear();
  }

  private updateSelectableComponent(entityId: string, isSelected: boolean): void {
    const entity = parseInt(entityId);
    const selectable = this.world.getComponent(entity, SelectableComponent);
    if (selectable) {
      selectable.isSelected = isSelected;
    }
  }
}
