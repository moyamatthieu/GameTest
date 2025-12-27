/**
 * Contract: SelectionBox Interface
 *
 * Purpose: Renders a semi-transparent green rectangle overlay during
 * box selection drag operations. This is a pure UI component with no
 * game logic - it only provides visual feedback.
 *
 * Implementation: HTML/CSS overlay (not Three.js)
 *
 * Dependencies:
 * - HTMLElement: Container for the selection box element
 */

export interface ISelectionBox {
  /**
   * Show the selection box at the given screen coordinates.
   *
   * Behavior:
   * - Calculates bounding box from corner positions
   * - Updates element CSS (left, top, width, height)
   * - Sets display='block' to make visible
   *
   * Handles negative rectangles (drag up/left):
   * - left = min(x1, x2)
   * - top = min(y1, y2)
   * - width = abs(x2 - x1)
   * - height = abs(y2 - y1)
   *
   * @param x1 - Start X in screen pixels
   * @param y1 - Start Y in screen pixels
   * @param x2 - End X in screen pixels
   * @param y2 - End Y in screen pixels
   *
   * @example
   * // Show box from (100, 100) to (300, 200)
   * selectionBox.show(100, 100, 300, 200);
   *
   * // Show box from (300, 200) to (100, 100) - same result
   * selectionBox.show(300, 200, 100, 100);
   */
  show(x1: number, y1: number, x2: number, y2: number): void;

  /**
   * Hide the selection box.
   *
   * Behavior:
   * - Sets display='none'
   * - Element remains in DOM
   *
   * @example
   * // Hide on mouse up
   * selectionBox.hide();
   */
  hide(): void;

  /**
   * Remove selection box from DOM and clean up.
   *
   * Behavior:
   * - Removes element from DOM
   * - Releases references
   *
   * Call this when:
   * - Input handler is disposed
   * - UI is rebuilt
   *
   * @example
   * // On cleanup
   * selectionBox.dispose();
   */
  dispose(): void;
}

/**
 * Internal implementation details (not part of public API)
 */
export interface ISelectionBoxInternal extends ISelectionBox {
  /**
   * DOM element
   */
  element: HTMLDivElement;
  isVisible: boolean;

  /**
   * Setup CSS styles on element.
   *
   * Applies:
   * - position: absolute
   * - border: 2px solid #00ff00
   * - backgroundColor: rgba(0, 255, 0, 0.1)
   * - pointerEvents: none (don't block mouse events)
   * - display: none (initially hidden)
   * - zIndex: 1000 (above game canvas)
   */
  setupStyles(): void;
}

/**
 * Constructor parameters
 */
export interface ISelectionBoxConstructor {
  container: HTMLElement; // Parent element (usually canvas parent)
}

/**
 * Style configuration (optional, for customization)
 */
export interface ISelectionBoxStyle {
  borderColor: string;          // Default: '#00ff00'
  borderWidth: string;          // Default: '2px'
  backgroundColor: string;      // Default: 'rgba(0, 255, 0, 0.1)'
  zIndex: string;               // Default: '1000'
}

/**
 * HTML Structure
 *
 * Expected DOM hierarchy:
 *
 * <div id="app">                    ← container
 *   <canvas></canvas>               ← game canvas
 *   <div class="selection-box">     ← SelectionBox element
 *   </div>
 * </div>
 *
 * CSS (applied via JavaScript):
 *
 * .selection-box {
 *   position: absolute;
 *   border: 2px solid #00ff00;
 *   background-color: rgba(0, 255, 0, 0.1);
 *   pointer-events: none;
 *   display: none;
 *   z-index: 1000;
 * }
 */
