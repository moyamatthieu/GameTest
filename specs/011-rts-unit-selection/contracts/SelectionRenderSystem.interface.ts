/**
 * Contract: SelectionRenderSystem Interface
 *
 * Purpose: Manages visual feedback for selected units by rendering
 * green selection circles beneath them using THREE.InstancedMesh.
 *
 * This system is responsible ONLY for rendering - selection logic
 * is handled by SelectionSystem. It reads SelectableComponent.isSelected
 * and updates circle positions each frame.
 *
 * Dependencies:
 * - THREE.Scene: For adding/removing instanced mesh
 * - World: For querying SelectableComponent
 *
 * Related Components:
 * - SelectableComponent: Source of selection state
 */

import * as THREE from 'three';
import { World, Entity } from '../../src/ecs/World';

export interface ISelectionRenderSystem {
  /**
   * Update selection circle positions (called every frame).
   *
   * Behavior:
   * - Queries all entities with SelectableComponent.isSelected=true
   * - Gets world position of each selected entity
   * - Updates InstancedMesh matrix for each circle
   * - Sets instancedCircles.count to number of selected entities
   * - Marks instanceMatrix.needsUpdate = true
   *
   * Performance:
   * - Target: <1ms for 500 selected units
   * - Single draw call regardless of selection count
   *
   * @param deltaTime - Time since last frame in milliseconds (currently unused)
   *
   * @example
   * // In game loop
   * function gameLoop(deltaTime: number) {
   *   // ... other systems
   *   selectionRenderSystem.update(deltaTime);
   *   renderer.render();
   * }
   */
  update(deltaTime: number): void;

  /**
   * Cleanup rendering resources (geometry, material, mesh).
   *
   * Behavior:
   * - Removes instancedCircles from scene
   * - Disposes geometry and material
   * - Releases GPU resources
   *
   * Call this when:
   * - Game is shutting down
   * - Switching to a different rendering system
   *
   * @example
   * // On cleanup
   * selectionRenderSystem.dispose();
   */
  dispose(): void;
}

/**
 * Internal state (not part of public API)
 */
export interface ISelectionRenderSystemInternal extends ISelectionRenderSystem {
  /**
   * THREE.js rendering objects
   */
  instancedCircles: THREE.InstancedMesh;
  circleGeometry: THREE.RingGeometry;
  circleMaterial: THREE.MeshBasicMaterial;

  /**
   * Configuration
   */
  maxInstances: number; // Maximum number of circles (e.g., 1000)

  /**
   * Initialize instanced mesh (called in constructor).
   *
   * Creates:
   * - RingGeometry (inner radius 2, outer radius 2.2, 32 segments)
   * - MeshBasicMaterial (green, transparent, depthTest=false)
   * - InstancedMesh (maxInstances capacity)
   *
   * Adds to scene.
   */
  initInstancedMesh(): void;

  /**
   * Get world position of entity's mesh.
   *
   * @param entity - Entity ID
   * @returns World position vector, or null if mesh not found
   */
  getEntityWorldPosition(entity: Entity): THREE.Vector3 | null;
}

/**
 * Constructor parameters
 */
export interface ISelectionRenderSystemConstructor {
  scene: THREE.Scene;
  world: World;
}

/**
 * Configuration options (optional, for customization)
 */
export interface ISelectionCircleConfig {
  innerRadius: number;          // Default: 2
  outerRadius: number;          // Default: 2.2
  segments: number;             // Default: 32
  color: number;                // Default: 0x00ff00 (green)
  opacity: number;              // Default: 0.8
  heightOffset: number;         // Default: 0.1 (above ground)
}

/**
 * Rendering metrics (for profiling/debugging)
 */
export interface ISelectionRenderMetrics {
  instanceCount: number;        // Current number of rendered circles
  updateTime: number;           // ms to update matrices
  drawCalls: number;            // Should always be 1 (instanced)
}
