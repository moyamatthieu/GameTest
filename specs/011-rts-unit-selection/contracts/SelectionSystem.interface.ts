/**
 * Contract: SelectionSystem Interface
 *
 * Purpose: Defines the public API for the RTS unit selection system.
 * This system handles raycasting for single-click selection and frustum
 * culling for box selection, updating component state accordingly.
 *
 * Dependencies:
 * - THREE.Scene: For raycasting against scene objects
 * - THREE.Camera: For converting mouse coords to 3D rays
 * - World: ECS world for querying/updating components
 * - SceneManager: For getting current ViewScale
 *
 * Related Components:
 * - SelectableComponent: Per-entity selection state
 * - SelectionStateComponent: Global selection state
 * - LocationComponent: ViewScale filtering
 */

import * as THREE from 'three';
import { World, Entity } from '../../src/ecs/World';
import { ViewScale } from '../../src/core/world/types';
import { SceneManager } from '../../src/core/renderer/SceneManager';

export interface ISelectionSystem {
  /**
   * Select units at the given mouse position (single-click selection).
   *
   * Behavior:
   * - Performs raycasting from mouse position
   * - Finds first intersected object with userData.entityId
   * - Checks if entity has SelectableComponent and correct ownerId
   * - Filters by current ViewScale
   * - If multiSelect=false: Clears all existing selections
   * - If multiSelect=true: Toggles clicked unit (add if unselected, remove if selected)
   *
   * @param mousePos - Mouse position in Normalized Device Coordinates [-1, 1]
   * @param multiSelect - If true, add to selection (Shift key held)
   *
   * @example
   * // Single selection (clear previous)
   * selectionSystem.selectAt({ x: 0.5, y: -0.2 }, false);
   *
   * // Additive selection (Shift+Click)
   * selectionSystem.selectAt({ x: 0.5, y: -0.2 }, true);
   */
  selectAt(mousePos: { x: number; y: number }, multiSelect: boolean): void;

  /**
   * Select all units within a screen-space box (box selection).
   *
   * Behavior:
   * - Creates frustum from box corners
   * - Tests each selectable entity's position against frustum
   * - Filters by current ViewScale and ownerId
   * - If multiSelect=false: Replaces existing selection
   * - If multiSelect=true: Adds box-selected units to existing selection
   *
   * @param startPos - Box start corner in NDC [-1, 1]
   * @param endPos - Box end corner in NDC [-1, 1]
   * @param multiSelect - If true, add to selection (Shift key held)
   *
   * @example
   * // Box selection (clear previous)
   * selectionSystem.selectBox(
   *   { x: -0.5, y: 0.5 },
   *   { x: 0.5, y: -0.5 },
   *   false
   * );
   *
   * // Additive box selection (Shift+Drag)
   * selectionSystem.selectBox(
   *   { x: -0.5, y: 0.5 },
   *   { x: 0.5, y: -0.5 },
   *   true
   * );
   */
  selectBox(
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    multiSelect: boolean
  ): void;

  /**
   * Clear all selections.
   *
   * Behavior:
   * - Sets all SelectableComponent.isSelected to false
   * - Clears SelectionStateComponent.selectedEntities
   *
   * @example
   * // Clear selection on left-click empty space
   * if (noUnitsClicked) {
   *   selectionSystem.clearSelection();
   * }
   */
  clearSelection(): void;

  /**
   * Handle ViewScale transition (Galaxy/System/Planet).
   *
   * Behavior:
   * - Automatically called when scale changes
   * - Clears all selections (per spec requirement)
   * - Updates internal scale filter
   *
   * @param newScale - The new ViewScale
   *
   * @example
   * // Hook up in SceneManager
   * sceneManager.onScaleChange((newScale) => {
   *   selectionSystem.onScaleChange(newScale);
   * });
   */
  onScaleChange(newScale: ViewScale): void;

  /**
   * Update selection system (called every frame).
   *
   * Behavior:
   * - Currently unused (hover preview could use this)
   * - Reserved for future features (animated selection, hover effects)
   *
   * @param deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime: number): void;
}

/**
 * Internal helper methods (not part of public API)
 */
export interface ISelectionSystemInternal extends ISelectionSystem {
  /**
   * Perform raycasting to find entity at mouse position.
   *
   * @param mouseNDC - Mouse position in NDC
   * @returns Entity ID if found and selectable, null otherwise
   */
  raycastSelect(mouseNDC: { x: number; y: number }): Entity | null;

  /**
   * Perform frustum culling to find entities in box.
   *
   * @param startNDC - Box start corner in NDC
   * @param endNDC - Box end corner in NDC
   * @returns Array of entity IDs within box
   */
  frustumSelect(
    startNDC: { x: number; y: number },
    endNDC: { x: number; y: number }
  ): Entity[];

  /**
   * Create frustum from screen-space box corners.
   *
   * @param startNDC - Box start corner in NDC
   * @param endNDC - Box end corner in NDC
   * @returns THREE.Frustum representing the box
   */
  createFrustumFromBox(
    startNDC: { x: number; y: number },
    endNDC: { x: number; y: number }
  ): THREE.Frustum;

  /**
   * Get all selectable entities on current ViewScale.
   *
   * @returns Array of entity IDs that can be selected
   */
  getSelectableEntities(): Entity[];

  /**
   * Update SelectableComponent and SelectionStateComponent for entity.
   *
   * @param entity - Entity ID to update
   * @param selected - New selection state
   */
  updateEntitySelection(entity: Entity, selected: boolean): void;
}

/**
 * Constructor parameters
 */
export interface ISelectionSystemConstructor {
  scene: THREE.Scene;
  camera: THREE.Camera;
  world: World;
  sceneManager: SceneManager;
}

/**
 * Performance metrics (for profiling/debugging)
 */
export interface ISelectionMetrics {
  lastRaycastTime: number;          // ms
  lastBoxSelectionTime: number;     // ms
  selectableEntityCount: number;    // Current frame
  selectedEntityCount: number;      // Current frame
}
