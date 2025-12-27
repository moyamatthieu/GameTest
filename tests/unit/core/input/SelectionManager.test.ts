import { describe, it, expect, beforeEach } from 'vitest';
import { SelectionManager } from '../../../../src/core/input/SelectionManager';
import * as THREE from 'three';
import { World } from '../../../../src/ecs/World';
import { SelectableComponent } from '../../../../src/ecs/components/SelectableComponent';
import { SpatialGrid } from '../../../../src/core/utils/SpatialGrid';

describe('SelectionManager', () => {
  let camera: THREE.PerspectiveCamera;
  let scene: THREE.Scene;
  let world: World;
  let spatialGrid: SpatialGrid;
  let manager: SelectionManager;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    scene = new THREE.Scene();
    world = new World();
    spatialGrid = new SpatialGrid();
    manager = new SelectionManager(camera, scene, world, spatialGrid);
  });

  it('should initialize with empty selection', () => {
    expect(manager.selectionState.selectedEntityIds.size).toBe(0);
    expect(manager.selectionState.isSelecting).toBe(false);
  });

  it('should clear selection', () => {
    manager.selectionState.selectedEntityIds.add('1');
    manager.clearSelection();
    expect(manager.selectionState.selectedEntityIds.size).toBe(0);
  });

  // TODO: Add more tests for mouse handling, raycasting, etc.
});
