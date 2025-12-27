# Feature Specification: RTS Unit Selection and Command System

**Feature Branch**: 010-rts-unit-control
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "RTS Unit Selection and Command System: Implement top-down box selection and right-click movement/action commands as per the new constitution principle."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Unit Selection (Priority: P1)

As a player, I want to click on a single unit to select it so that I can give it orders.

**Why this priority**: Fundamental interaction for any RTS.

**Independent Test**: Can be tested by clicking a unit and verifying it is highlighted and added to the selection state.

**Acceptance Scenarios**:

1. **Given** a unit is visible on screen, **When** I left-click on it, **Then** the unit is selected and visually highlighted.
2. **Given** a unit is selected, **When** I left-click on empty ground, **Then** the unit is deselected.

---

### User Story 2 - Box Selection (Priority: P1)

As a player, I want to click and drag a rectangle to select multiple units at once.

**Why this priority**: Essential for managing groups of units in an RTS.

**Independent Test**: Can be tested by dragging a box over multiple units and verifying they are all selected.

**Acceptance Scenarios**:

1. **Given** multiple units on screen, **When** I click and drag a box over them, **Then** all units within the box are selected.
2. **Given** units are already selected, **When** I start a new box selection, **Then** the previous selection is replaced by the new one (unless Shift is held).

---

### User Story 3 - Movement Command (Priority: P1)

As a player, I want to right-click on the ground to order selected units to move there.

**Why this priority**: Core gameplay loop for unit management.

**Independent Test**: Can be tested by selecting a unit, right-clicking a destination, and verifying the unit moves to that point.

**Acceptance Scenarios**:

1. **Given** one or more units are selected, **When** I right-click on empty ground, **Then** the units move to the clicked position.
2. **Given** units are moving, **When** I give a new move command, **Then** they change course to the new destination.

---

### User Story 4 - Contextual Commands (Priority: P2)

As a player, I want to right-click on an object (enemy, resource) to perform a context-appropriate action.

**Why this priority**: Simplifies controls by using a single button for primary actions.

**Independent Test**: Can be tested by right-clicking an enemy and verifying units attack it.

**Acceptance Scenarios**:

1. **Given** combat units are selected, **When** I right-click an enemy unit, **Then** the selected units move to attack the enemy.
2. **Given** combat units are selected, **When** I issue an "Attack" command on empty ground, **Then** the units move toward the target and automatically attack any enemies encountered along the way.
3. **Given** cargo units are selected, **When** I right-click a resource node, **Then** the units move to extract resources.

---

### User Story 5 - Stop and Patrol Commands (Priority: P2)

As a player, I want to give explicit "Stop" and "Patrol" orders to manage unit behavior.

**Why this priority**: Essential for tactical positioning and area defense.

**Acceptance Scenarios**:

1. **Given** units are moving or attacking, **When** I issue a "Stop" command, **Then** they immediately cease all actions and stay in place.
2. **Given** units are selected, **When** I issue a "Patrol" command to a location, **Then** they move back and forth indefinitely between their current position and the target.

---

### User Story 6 - Control Groups (Priority: P2)

As a player, I want to assign units to numeric keys so that I can quickly re-select specific groups.

**Why this priority**: Standard RTS feature for high-level unit management.

**Acceptance Scenarios**:

1. **Given** a selection of units, **When** I press Ctrl + [0-9], **Then** the current selection is saved to that numeric slot.
2. **Given** a saved group, **When** I press the corresponding [0-9] key, **Then** those units are immediately selected.

---

### Edge Cases

- **Selection across environment boundaries**: What happens if a box selection is attempted while the camera is transitioning between system and planet? (Assumption: Selection is restricted to the currently active environment).
- **Overlapping units**: How does the system handle clicking where multiple units overlap? (Assumption: Select the one closest to the camera or the "top" one in the hierarchy).
- **Commanding non-controllable units**: What happens if I try to command an enemy or neutral unit? (Assumption: Command is ignored).

## Requirements *(mandatory)*
- **FR-002**: System MUST render a visual selection box (rectangle) when the player clicks and drags the left mouse button.
- **FR-003**: System MUST support single-click selection with a small tolerance (pixel radius).
- **FR-004**: System MUST support additive selection when the Shift key is held during click or box selection.
- **FR-005**: System MUST emit an `RTSCommand` when a command is issued (Move, Attack, Stop, Patrol, Harvest).
- **FR-006**: System MUST visually highlight selected units (e.g., a circle primitive under the unit as per Principle X).
- **FR-007**: System MUST restrict selection and commands to the currently active environment (Galaxy, System, or Planet) as per Principle IX.
- **FR-008**: System MUST allow binding the current selection to keys 0-9 using Ctrl and recalling them by pressing the key.
- **FR-009**: Box selection MUST include all player-controlled units within the selection rectangle regardless of unit type.
- **FR-010**: System MUST provide temporary visual feedback (e.g., a ground indicator) at the target location when a command is issued.

### Key Entities *(include if feature involves data)*

- **SelectionState**: A list of entity IDs currently controlled by the player.
- **Command**: A data structure containing type (Move, Attack, Harvest), target (Vector3 or EntityID), and subjectIds (list of units).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can select a group of 50 units using box selection in under 1 second.
- **SC-002**: Selection box rendering maintains 60 FPS even with 1000+ units on screen.
- **SC-003**: Command latency (from click to unit reaction) is under 100ms in local simulation.
- **SC-004**: 100% of right-click commands on valid targets result in the correct unit behavior.

## Clarifications

### Session 2025-12-26
- Q: Comportement de l'ordre "Patrouille" → A: Boucle infinie entre la position de départ et la cible.
- Q: Comportement de l'ordre "Attaque" (Attack-Move) → A: Attack-Move (avance et attaque tout ennemi en chemin).
- Q: Groupes de contrôle (Control Groups) → A: Ctrl + [0-9] pour créer, [0-9] pour sélectionner.
- Q: Priorité de sélection (Selection Priority) → A: Sélectionne toutes les unités dans le rectangle (pas de filtrage par défaut).
- Q: Feedback visuel des ordres (Command Feedback) → A: Indicateur visuel temporaire au point d'impact (ex: flèche ou cercle coloré).

## Constitution Alignment

- [x] **Top-Down View**: Selection logic uses screen-to-world raycasting optimized for a top-down perspective.
- [x] **RTS Controls**: Implements standard box selection and right-click command patterns.
- [x] **P2P Architecture**: Commands are designed to be signed and validated by the consensus layer (Principle I).
