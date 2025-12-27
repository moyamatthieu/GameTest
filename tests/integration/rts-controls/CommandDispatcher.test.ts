import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandDispatcher } from '../../../src/core/input/CommandDispatcher';
import * as THREE from 'three';
import { SelectionManager } from '../../../src/core/input/SelectionManager';
import { ConnectionManager } from '../../../src/core/network/ConnectionManager';
import { World } from '../../../src/ecs/World';
import { SpatialGrid } from '../../../src/core/utils/SpatialGrid';

describe('CommandDispatcher', () => {
  let camera: THREE.PerspectiveCamera;
  let scene: THREE.Scene;
  let selectionManager: SelectionManager;
  let connectionManager: ConnectionManager;
  let dispatcher: CommandDispatcher;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    scene = new THREE.Scene();
    const world = new World();
    const spatialGrid = new SpatialGrid();
    selectionManager = new SelectionManager(camera, scene, world, spatialGrid);
    connectionManager = new ConnectionManager();
    dispatcher = new CommandDispatcher(camera, scene, selectionManager, connectionManager);
  });

  it('should initialize', () => {
    expect(dispatcher).toBeDefined();
  });

  // TODO: Add more tests for command dispatching
});
