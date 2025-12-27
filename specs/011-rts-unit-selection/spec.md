# Feature Specification: RTS Unit Selection System

**Feature Branch**: `011-rts-unit-selection`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: User description: "Implémenter le système de sélection d'unités RTS de base qui permet aux joueurs de sélectionner des unités individuelles ou des groupes d'unités en utilisant des contrôles RTS standards."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories are PRIORITIZED as user journeys ordered by importance.
  Each user story/journey is INDEPENDENTLY TESTABLE.
-->

### User Story 1 - Single Unit Selection (Priority: P1)

As a player, I want to left-click on a unit to select it so that I can see which unit I'm about to command.

**Why this priority**: Single unit selection is the most fundamental interaction in an RTS - without it, no unit control is possible. This is the absolute minimum viable feature.

**Independent Test**: Can be fully tested by clicking on a unit and verifying visual feedback (green selection circle appears under the unit). Delivers value by showing which unit is active.

**Acceptance Scenarios**:

1. **Given** a player-controlled unit is visible on screen, **When** I left-click directly on it, **Then** the unit becomes selected and displays a green selection circle beneath it
2. **Given** a unit is already selected, **When** I left-click on a different unit, **Then** the previous selection is cleared and the new unit becomes selected with visual feedback
3. **Given** a unit is selected, **When** I left-click on empty space, **Then** the unit is deselected and the selection circle disappears
4. **Given** I left-click on an enemy or neutral unit, **When** the click registers, **Then** no selection occurs (only player-owned units can be selected)

---

### User Story 2 - Box Selection (Priority: P1)

As a player, I want to click and drag a rectangle to select multiple units at once so that I can efficiently manage groups without clicking each unit individually.

**Why this priority**: Multi-unit selection is essential for RTS gameplay - managing armies unit-by-unit is impractical. This is necessary for any meaningful group control.

**Independent Test**: Can be fully tested by dragging a selection box over multiple units and verifying all enclosed units display selection circles. Delivers value by enabling group management.

**Acceptance Scenarios**:

1. **Given** multiple player units are visible, **When** I click-and-drag the left mouse button to create a rectangle enclosing several units, **Then** all player-owned units within the rectangle become selected with green circles
2. **Given** I start dragging a selection box, **When** the mouse moves, **Then** a semi-transparent selection rectangle is visible on screen showing the current selection area
3. **Given** I complete a box selection, **When** the selection box includes both player units and enemy units, **Then** only player-owned units are selected
4. **Given** units are already selected, **When** I create a new box selection without holding Shift, **Then** the previous selection is replaced entirely by units in the new box
5. **Given** I drag a box selection that contains no units, **When** I release the mouse button, **Then** the previous selection is cleared

---

### User Story 3 - Additive Selection with Shift (Priority: P2)

As a player, I want to hold Shift while clicking or box-selecting to add units to my existing selection so that I can build custom groups incrementally.

**Why this priority**: Enables tactical flexibility and custom group composition, but basic selection must work first. This enhances the selection system but isn't required for minimal functionality.

**Independent Test**: Can be tested by selecting one unit, then Shift-clicking another, verifying both show selection circles. Delivers value by enabling custom group composition without control groups.

**Acceptance Scenarios**:

1. **Given** one or more units are already selected, **When** I hold Shift and left-click on an unselected unit, **Then** the clicked unit is added to the selection while existing selected units remain selected
2. **Given** one or more units are already selected, **When** I hold Shift and left-click on an already-selected unit, **Then** that unit is removed from the selection (toggle behavior)
3. **Given** units are already selected, **When** I hold Shift and drag a box selection, **Then** all units within the box are added to the existing selection
4. **Given** I hold Shift during box selection that includes some already-selected units, **When** I complete the selection, **Then** already-selected units remain selected and new units are added (no deselection occurs)

---

### User Story 4 - Selection Visual Feedback (Priority: P1)

As a player, I want clear visual indicators showing which units are selected so that I always know what I'm controlling.

**Why this priority**: Without visual feedback, selection is invisible and unusable. This must be implemented alongside selection logic for any user value.

**Independent Test**: Can be tested by selecting units and verifying consistent, visible selection indicators. Delivers value by making selection state immediately apparent.

**Acceptance Scenarios**:

1. **Given** a unit becomes selected, **When** the selection occurs, **Then** a green circle primitive is rendered on the ground directly beneath the unit
2. **Given** multiple units are selected, **When** viewing the scene, **Then** each selected unit displays its own distinct green selection circle
3. **Given** units are selected and move, **When** units change position, **Then** selection circles follow the units maintaining correct position beneath them
4. **Given** a unit is deselected, **When** deselection occurs, **Then** the selection circle disappears immediately
5. **Given** the box selection is in progress, **When** I drag the mouse, **Then** a semi-transparent green rectangle is drawn from the start point to the current mouse position

---

### User Story 5 - Multi-Scale Selection (Priority: P2)

As a player, I want selection to work consistently across all three view scales (Galaxy, System, Planet) so that unit management feels natural regardless of zoom level.

**Why this priority**: Required for feature completeness across the entire game, but initial implementation can focus on a single scale. This ensures architectural consistency.

**Independent Test**: Can be tested by switching between scales and performing selections at each level, verifying selection mechanics work identically. Delivers value by maintaining consistent controls across the game.

**Acceptance Scenarios**:

1. **Given** I am in Galaxy view with visible units, **When** I perform box or click selection, **Then** selection works with the same input mechanics as other scales
2. **Given** I am in System view with visible units, **When** I perform selection operations, **Then** selection behavior matches other scales
3. **Given** I am in Planet view with visible units, **When** I perform selection operations, **Then** selection behavior matches other scales
4. **Given** I have units selected in one scale, **When** I transition to a different scale, **Then** the selection is cleared (selection does not persist across scale changes)

---

### Edge Cases

- **Overlapping units**: When multiple units are stacked at the same position and I click, which unit is selected? (Assumption: Select the unit with the highest rendering order or most recently created entity)
- **Selection during camera movement**: What happens if I start a box selection and then move the camera before releasing? (Assumption: Box selection continues relative to world space, not screen space, or is cancelled if camera changes significantly)
- **Rapid click-drag distinction**: How does the system differentiate between a quick click and a drag for box selection? (Assumption: If mouse moves less than 5 pixels before release, treat as click; otherwise treat as box selection)
- **Off-screen selection**: Can I start a box selection on-screen and drag off-screen? (Assumption: Box extends to screen boundaries and selects any units within the visible portion)
- **Performance with large selections**: How does the system handle selecting 500+ units? (Assumption: Visual feedback may be optimized/batched, but selection state must remain accurate)
- **Selection during transition**: What happens if I attempt selection while transitioning between Galaxy/System/Planet views? (Assumption: Selection inputs are disabled during transitions)
- **Enemy unit filtering**: If I box-select an area with mixed friendly and enemy units, how are enemies filtered? (Assumption: Enemy units are never added to selection state, only player-owned units)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect left mouse button clicks and determine if the click intersects any player-owned unit using raycasting
- **FR-002**: System MUST support single-click selection by identifying the unit at the click position and setting it as the sole selected unit
- **FR-003**: System MUST support box selection by detecting left-mouse-down, tracking mouse drag, and selecting all player-owned units within the rectangle on mouse-up
- **FR-004**: System MUST render a semi-transparent green selection rectangle on screen during box selection drag operations
- **FR-005**: System MUST render a green circle primitive on the ground beneath each selected unit as visual feedback
- **FR-006**: System MUST clear all selections when left-clicking on empty space (no units under cursor and not dragging)
- **FR-007**: System MUST support additive selection when Shift key is held during click or box selection
- **FR-008**: System MUST support toggle deselection when Shift-clicking an already-selected unit
- **FR-009**: System MUST maintain selection state in a centralized data structure accessible by command and UI systems
- **FR-010**: System MUST filter selection to only include player-owned units (exclude enemy, neutral, or non-unit entities)
- **FR-011**: System MUST restrict selection operations to the currently active environment scale (Galaxy, System, or Planet)
- **FR-012**: System MUST clear selection state when transitioning between environment scales
- **FR-013**: System MUST update selection circle positions every frame to follow unit movement
- **FR-014**: System MUST distinguish between click and drag based on mouse movement threshold (e.g., 5 pixels)
- **FR-015**: System MUST use efficient spatial queries for box selection to avoid checking every entity in the scene
- **FR-016**: System MUST provide a query interface (getSelectedEntities()) for the order system to retrieve currently selected units when issuing Move/Attack/Build commands

### Key Entities

- **SelectionState**: Central data structure containing the list of currently selected entity IDs, accessible globally for command systems
- **SelectionCircle**: Visual indicator (green circle primitive) rendered on the ground plane at unit positions, managed per selected unit
- **SelectionBox**: Temporary UI element displaying the selection rectangle during drag operations, defined by start and end screen coordinates
- **Unit**: Any player-controlled entity that can be selected, must have components for position, ownership, and rendering

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can select a single unit with 100% accuracy when clicking directly on the unit's visual representation
- **SC-002**: Box selection of up to 50 units completes in under 0.5 seconds from drag completion to visual feedback
- **SC-003**: Selection system maintains 60 FPS performance with up to 1000 units on screen
- **SC-004**: Selection circles remain visually accurate (within 1 world unit) to unit positions during movement
- **SC-005**: 95% of player selection attempts (single or box) result in the intended units being selected on first try
- **SC-006**: Additive selection with Shift key has zero input lag (user perceives immediate response)
- **SC-007**: Box selection visual feedback (rectangle) updates at 60 FPS during drag operations
- **SC-008**: Selection state changes (select/deselect) are reflected visually within 16ms (one frame at 60 FPS)

## Assumptions

- The game uses a top-down camera perspective, simplifying raycasting for selection (rays cast perpendicular to ground plane)
- Units have collision shapes or bounding volumes suitable for raycasting intersection tests
- The renderer supports drawing circle primitives and UI rectangles with transparency
- A centralized input system provides mouse position, button states, and keyboard states
- The ECS architecture allows querying entities by position and ownership
- The game runs at a target of 60 FPS, informing performance requirements
- Units are distinguishable on screen at normal gameplay zoom levels
- The player ownership model is clear (each unit has an owner ID, and local player ID is known)

## Constitution Alignment

**RTS Paradigm Validation** (NON-NEGOTIABLE):

- [x] **Top-Down View**: Selection uses screen-to-world raycasting optimized for top-down perspective. Selection circles are rendered on the ground plane.
- [x] **Order-Based Control**: Selection is the prerequisite for giving orders - this feature provides the selection primitive for the future order system (feature 012-unit-orders). The SelectionStateComponent.getSelectedEntities() method will be queried by the order system.
- [x] **Pathfinding Navigation**: Selection integrates with pathfinding by providing selected unit targets for PathfindingSystem. Selected units will receive move orders that are executed via A* pathfinding (not implemented in this feature).
- [x] **ECS Architecture**: Selection state is stored in components (SelectableComponent, SelectionStateComponent), selection logic is a system (SelectionSystem), rendering is separate (SelectionRenderSystem). **Tick-based Simulation**: Selection state updates are frame-based for immediate visual feedback, but selection validation can be integrated with tick-based command system for deterministic P2P synchronization.
- [x] **RTS Controls**: Implements standard RTS box selection, single-click selection, and Shift-based additive selection. **Note**: Control groups (1-0 keys) as mandated by Principe XII and XV are deliberately OUT OF SCOPE for this feature and will be implemented in feature 012-control-groups.
- [x] **Construction System**: Not applicable - this feature is specific to unit selection.
- [x] **P2P Architecture**: Selection is local-only (does not need to be synchronized), compatible with P2P command model.
- [x] **Persistence Fallback**: Selection state is ephemeral and does not need persistence - it's rebuilt from user input each session.
