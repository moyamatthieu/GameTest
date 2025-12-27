/**
 * Contract: SelectionInputHandler Interface
 *
 * Purpose: Handles mouse input for selection operations.
 * Differentiates between clicks and drags, tracks Shift key,
 * and calls appropriate SelectionSystem methods.
 *
 * Responsibilities:
 * - Listen to mousedown, mousemove, mouseup events
 * - Detect click vs drag (5px threshold)
 * - Track Shift key for multi-select
 * - Show/hide selection box overlay during drag
 * - Convert screen coordinates to NDC
 *
 * Dependencies:
 * - HTMLCanvasElement: For event listeners
 * - SelectionSystem: For invoking selection logic
 * - SelectionBox: For visual overlay
 */

import { ISelectionSystem } from './SelectionSystem.interface';
import { ISelectionBox } from './SelectionBox.interface';

export interface ISelectionInputHandler {
  /**
   * Clean up event listeners and resources.
   *
   * Behavior:
   * - Removes all mouse event listeners
   * - Disposes SelectionBox
   *
   * Call this when:
   * - Input handler is no longer needed
   * - Switching input contexts
   *
   * @example
   * // On cleanup
   * selectionInputHandler.dispose();
   */
  dispose(): void;
}

/**
 * Internal state and methods (not part of public API)
 */
export interface ISelectionInputHandlerInternal extends ISelectionInputHandler {
  /**
   * State tracking
   */
  isDragging: boolean;              // True if drag distance > threshold
  dragStartX: number;               // Screen X where mouse down occurred
  dragStartY: number;               // Screen Y where mouse down occurred
  dragThreshold: number;            // Pixel distance to trigger drag (5px)

  /**
   * Dependencies
   */
  canvas: HTMLCanvasElement;
  selectionSystem: ISelectionSystem;
  selectionBox: ISelectionBox;

  /**
   * Event handlers
   */
  onMouseDown(event: MouseEvent): void;
  onMouseMove(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;

  /**
   * Helper methods
   */
  registerEventListeners(): void;
  screenToNDC(screenX: number, screenY: number): { x: number; y: number };
}

/**
 * Constructor parameters
 */
export interface ISelectionInputHandlerConstructor {
  canvas: HTMLCanvasElement;
  selectionSystem: ISelectionSystem;
}

/**
 * Mouse input event data
 */
export interface IMouseInputEvent {
  screenX: number;                  // Absolute screen X
  screenY: number;                  // Absolute screen Y
  ndcX: number;                     // Normalized Device Coordinate X [-1, 1]
  ndcY: number;                     // Normalized Device Coordinate Y [-1, 1]
  shiftKey: boolean;                // True if Shift is held
  ctrlKey: boolean;                 // True if Ctrl is held
  button: number;                   // Mouse button (0=left, 1=middle, 2=right)
}

/**
 * Click vs Drag Detection Algorithm
 *
 * State Machine:
 *
 * [Idle]
 *   │
 *   │ mousedown (button=0)
 *   ▼
 * [Mouse Down] (store start position)
 *   │
 *   ├─ mousemove (distance < 5px)
 *   │  └─ [Mouse Down] (stay in same state)
 *   │
 *   ├─ mousemove (distance >= 5px)
 *   │  └─▶ [Dragging] (show SelectionBox)
 *   │
 *   └─ mouseup
 *      └─▶ [Idle] (single click → SelectionSystem.selectAt())
 *
 * [Dragging]
 *   │
 *   ├─ mousemove
 *   │  └─ [Dragging] (update SelectionBox)
 *   │
 *   └─ mouseup
 *      └─▶ [Idle] (box selection → SelectionSystem.selectBox())
 *
 * Distance Formula:
 *   distance = sqrt((currentX - startX)^2 + (currentY - startY)^2)
 *   if (distance > threshold) → isDragging = true
 */

/**
 * Screen to NDC Conversion
 *
 * Normalized Device Coordinates (NDC) range from -1 to +1 in both X and Y.
 *
 * Conversion Formula:
 *   ndcX = (screenX / canvasWidth) * 2 - 1
 *   ndcY = -(screenY / canvasHeight) * 2 + 1
 *
 * Note: Y is inverted (screen Y increases downward, NDC Y increases upward)
 *
 * Example:
 *   Screen (0, 0)          → NDC (-1, 1)   [top-left]
 *   Screen (width, height) → NDC (1, -1)   [bottom-right]
 *   Screen (width/2, height/2) → NDC (0, 0) [center]
 */
