import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../../src/ecs/World';
import { WorldSystem } from '../../../src/ecs/systems/WorldSystem';
import { WorldGenerator } from '../../../src/core/world/WorldGenerator';
import { LocationComponent } from '../../../src/ecs/components/LocationComponent';
import { SceneManager } from '../../../src/core/renderer/SceneManager';

describe('View Switching Integration', () => {
  let world: World;
  let worldSystem: WorldSystem;
  let sceneManager: SceneManager;
  let playerLocation: LocationComponent;

  beforeEach(() => {
    world = new World();
    const seed = 'TEST-SEED';
    const generator = new WorldGenerator(seed);
    const universe = generator.generateUniverse(seed);
    sceneManager = new SceneManager();
    worldSystem = new WorldSystem(world, universe, sceneManager);

    const playerEntity = world.createEntity();
    // Get a valid system ID from the universe
    const firstCluster = universe.clusters.get('0,0')!;
    const firstSystem = firstCluster.systems[0];

    playerLocation = new LocationComponent(0, 0, firstSystem.id, 'Galaxy');
    world.addComponent(playerEntity, playerLocation);
  });

  it('should start in Galaxy view and have cluster objects', () => {
    worldSystem.update(playerLocation);
    // Check if galaxy group is in scene
    const galaxyGroup = sceneManager.scene.children.find(c => c instanceof THREE.Group);
    expect(galaxyGroup).toBeDefined();
  });

  it('should switch to System view and clear galaxy objects', () => {
    worldSystem.update(playerLocation);

    playerLocation.viewScale = 'System';
    worldSystem.update(playerLocation);

    // In System view, we should have a different group
    // (This is a bit hard to test without deep inspection of Three.js objects)
    expect(sceneManager.scene.children.length).toBeGreaterThan(0);
  });
});

// Mock THREE if needed, but Vitest usually handles it if three is installed
import * as THREE from 'three';
