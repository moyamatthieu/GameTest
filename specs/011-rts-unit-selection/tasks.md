---
description: "Task list for RTS Unit Selection System implementation"
---

# Tasks: RTS Unit Selection System

**Feature**: 011-rts-unit-selection  
**Input**: Design documents from `/specs/011-rts-unit-selection/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are NOT included in this implementation - focus is on core selection functionality first.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Constraints**:
- REFACTOR (not create): SelectableComponent.ts, SelectionSystem.ts, MovementController.ts
- NEW FILES: SelectionStateComponent.ts, SelectionRenderSystem.ts, SelectionInputHandler.ts, SelectionBox.ts

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and refactoring foundation

- [ ] T001 Review existing implementation in src/ecs/components/SelectableComponent.ts and src/ecs/systems/SelectionSystem.ts
- [ ] T002 Review contract interfaces in specs/011-rts-unit-selection/contracts/ for API requirements
- [ ] T003 Create utility helper function getSelectionState() for accessing singleton in src/ecs/systems/SelectionSystem.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core component and system refactoring that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Refactor SelectableComponent in src/ecs/components/SelectableComponent.ts (remove selectionCircle: THREE.Mesh, add selectionCircleIndex: number)
- [ ] T005 [P] Create SelectionStateComponent in src/ecs/components/SelectionStateComponent.ts with selectedEntities Set and selectionBox state
- [ ] T006 [P] Create SelectionBox UI component in src/ui/components/SelectionBox.ts for visual rectangle overlay
- [ ] T007 Initialize SelectionStateComponent singleton in src/main.ts during game initialization
- [ ] T008 Add getCurrentViewScale() method to SceneManager in src/core/renderer/SceneManager.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Single Unit Selection (Priority: P1) 🎯 MVP

**Goal**: Enable clicking on a unit to select it with green circle visual feedback

**Independent Test**: Click on a unit → verify green selection circle appears beneath it; click another unit → previous selection clears, new unit shows circle

**Contract Reference**: specs/011-rts-unit-selection/contracts/SelectionSystem.interface.ts

### Implementation for User Story 1

- [ ] T009 [P] [US1] Refactor SelectionSystem.selectAt() method in src/ecs/systems/SelectionSystem.ts (implement raycasting logic per contract)
- [ ] T010 [P] [US1] Implement SelectionSystem.clearSelection() method in src/ecs/systems/SelectionSystem.ts
- [ ] T011 [US1] Add player ownership filtering to SelectionSystem.selectAt() in src/ecs/systems/SelectionSystem.ts (check ownerId matches local player)
- [ ] T012 [US1] Add ViewScale filtering to SelectionSystem.selectAt() in src/ecs/systems/SelectionSystem.ts (use LocationComponent.viewScale)
- [ ] T013 [US1] Update SelectionSystem to use SelectionStateComponent.selectedEntities instead of individual component state in src/ecs/systems/SelectionSystem.ts
- [ ] T014 [US1] Create SelectionInputHandler in src/ui/input/SelectionInputHandler.ts (handle mousedown/mouseup for click detection)
- [ ] T015 [US1] Add screenToNDC() helper method to SelectionInputHandler in src/ui/input/SelectionInputHandler.ts
- [ ] T016 [US1] Connect SelectionInputHandler to SelectionSystem.selectAt() for left-click events in src/ui/input/SelectionInputHandler.ts
- [ ] T017 [US1] Implement click vs drag detection (5px threshold) in SelectionInputHandler in src/ui/input/SelectionInputHandler.ts
- [ ] T018 [US1] Integrate SelectionInputHandler initialization in src/main.ts (replace existing mouse listener if any)

**Checkpoint**: At this point, User Story 1 (single selection) should be functional - verify by clicking units

---

## Phase 4: User Story 4 - Selection Visual Feedback (Priority: P1)

**Goal**: Render green selection circles beneath all selected units

**Independent Test**: Select one or more units → verify each displays a green circle that follows unit movement

**Contract Reference**: specs/011-rts-unit-selection/contracts/SelectionRenderSystem.interface.ts

### Implementation for User Story 4

- [ ] T019 [P] [US4] Create SelectionRenderSystem in src/ecs/systems/SelectionRenderSystem.ts (initialize InstancedMesh for circles)
- [ ] T020 [US4] Implement initInstancedMesh() in SelectionRenderSystem in src/ecs/systems/SelectionRenderSystem.ts (RingGeometry with green material, maxInstances=1000)
- [ ] T021 [US4] Implement SelectionRenderSystem.update() in src/ecs/systems/SelectionRenderSystem.ts (query selected entities, update instance matrices)
- [ ] T022 [US4] Add helper getEntityWorldPosition() to SelectionRenderSystem in src/ecs/systems/SelectionRenderSystem.ts
- [ ] T023 [US4] Update SelectableComponent.selectionCircleIndex when entities are selected/deselected in src/ecs/systems/SelectionRenderSystem.ts
- [ ] T024 [US4] Implement SelectionRenderSystem.dispose() method in src/ecs/systems/SelectionRenderSystem.ts
- [ ] T025 [US4] Integrate SelectionRenderSystem into game loop in src/main.ts (call update() each frame)
- [ ] T026 [US4] Set circle render order and depthTest to prevent z-fighting with ground in src/ecs/systems/SelectionRenderSystem.ts

**Checkpoint**: Selected units should now display green circles that follow them during movement

---

## Phase 5: User Story 2 - Box Selection (Priority: P1)

**Goal**: Enable click-and-drag rectangle to select multiple units at once

**Independent Test**: Click and drag a box over multiple units → release mouse → all enclosed units display selection circles

**Contract Reference**: specs/011-rts-unit-selection/contracts/SelectionSystem.interface.ts

### Implementation for User Story 2

- [ ] T027 [P] [US2] Implement SelectionSystem.selectBox() method in src/ecs/systems/SelectionSystem.ts (frustum culling algorithm per contract)
- [ ] T028 [P] [US2] Add screen-space to world-space projection for box corners in src/ecs/systems/SelectionSystem.ts
- [ ] T029 [US2] Add player ownership filtering to SelectionSystem.selectBox() in src/ecs/systems/SelectionSystem.ts
- [ ] T030 [US2] Add ViewScale filtering to SelectionSystem.selectBox() in src/ecs/systems/SelectionSystem.ts
- [ ] T031 [US2] Extend SelectionInputHandler.onMouseMove() to track drag state in src/ui/input/SelectionInputHandler.ts
- [ ] T032 [US2] Update SelectionInputHandler.onMouseUp() to call SelectionSystem.selectBox() on drag completion in src/ui/input/SelectionInputHandler.ts
- [ ] T033 [US2] Integrate SelectionBox.show() during drag in SelectionInputHandler in src/ui/input/SelectionInputHandler.ts
- [ ] T034 [US2] Integrate SelectionBox.hide() on mouse up in SelectionInputHandler in src/ui/input/SelectionInputHandler.ts
- [ ] T035 [US2] Update SelectionStateComponent.selectionBox state during drag in src/ui/input/SelectionInputHandler.ts

**Checkpoint**: Box selection should now work - drag a rectangle to select multiple units

---

## Phase 6: User Story 3 - Additive Selection with Shift (Priority: P2)

**Goal**: Enable Shift+Click and Shift+Drag to add/remove units from existing selection

**Independent Test**: Select a unit → hold Shift → click another unit → both units show circles; Shift+click selected unit → it deselects

**Contract Reference**: specs/011-rts-unit-selection/contracts/SelectionSystem.interface.ts

### Implementation for User Story 3

- [ ] T036 [P] [US3] Add multiSelect parameter support to SelectionSystem.selectAt() in src/ecs/systems/SelectionSystem.ts (toggle logic)
- [ ] T037 [P] [US3] Add multiSelect parameter support to SelectionSystem.selectBox() in src/ecs/systems/SelectionSystem.ts (additive logic)
- [ ] T038 [US3] Implement toggle selection logic (add if unselected, remove if selected) for Shift+Click in src/ecs/systems/SelectionSystem.ts
- [ ] T039 [US3] Track Shift key state in SelectionInputHandler in src/ui/input/SelectionInputHandler.ts (event.shiftKey)
- [ ] T040 [US3] Pass multiSelect=true to SelectionSystem.selectAt() when Shift is held in src/ui/input/SelectionInputHandler.ts
- [ ] T041 [US3] Pass multiSelect=true to SelectionSystem.selectBox() when Shift is held in src/ui/input/SelectionInputHandler.ts

**Checkpoint**: Additive selection with Shift should work for both click and box selection

---

## Phase 7: User Story 5 - Multi-Scale Selection (Priority: P2)

**Goal**: Ensure selection works consistently across Galaxy, System, and Planet view scales

**Independent Test**: Switch between scales and perform selections → selection mechanics work identically; verify selection clears on scale transition

**Contract Reference**: specs/011-rts-unit-selection/contracts/SelectionSystem.interface.ts

### Implementation for User Story 5

- [ ] T042 [P] [US5] Implement SelectionSystem.onScaleChange() method in src/ecs/systems/SelectionSystem.ts (clear selection on scale transition)
- [ ] T043 [US5] Add scale change event listener in SelectionSystem constructor in src/ecs/systems/SelectionSystem.ts
- [ ] T044 [US5] Verify ViewScale filtering works for Galaxy view in src/ecs/systems/SelectionSystem.ts (test with galaxy entities)
- [ ] T045 [US5] Verify ViewScale filtering works for System view in src/ecs/systems/SelectionSystem.ts (test with system entities)
- [ ] T046 [US5] Verify ViewScale filtering works for Planet view in src/ecs/systems/SelectionSystem.ts (test with planet entities)
- [ ] T047 [US5] Update SelectionRenderSystem to handle scale transitions gracefully in src/ecs/systems/SelectionRenderSystem.ts

**Checkpoint**: All user stories should now work independently across all three view scales

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, optimizations, and documentation

- [ ] T048 [P] Add JSDoc comments to all public methods in SelectionSystem per contracts in src/ecs/systems/SelectionSystem.ts
- [ ] T049 [P] Add JSDoc comments to all public methods in SelectionRenderSystem per contracts in src/ecs/systems/SelectionRenderSystem.ts
- [ ] T050 [P] Add JSDoc comments to all public methods in SelectionInputHandler per contracts in src/ui/input/SelectionInputHandler.ts
- [ ] T051 Optimize raycasting by caching raycaster instance in SelectionSystem in src/ecs/systems/SelectionSystem.ts
- [ ] T052 Add raycaster layer filtering for ViewScale optimization in src/ecs/systems/SelectionSystem.ts
- [ ] T053 Verify selection circle performance with 500+ selected units in src/ecs/systems/SelectionRenderSystem.ts
- [ ] T054 Add error handling for missing SelectionStateComponent in utility functions
- [ ] T055 Remove deprecated SelectionComponent.ts if it exists in src/ecs/components/
- [ ] T056 Update MovementController.ts to query SelectionStateComponent for unit orders in src/ui/input/MovementController.ts
- [ ] T057 Run quickstart.md validation scenarios manually
- [ ] T058 Verify edge cases: overlapping units, off-screen drag, rapid clicks
- [ ] T059 Performance profiling: measure raycasting time, box selection time, render update time
- [ ] T060 Code cleanup: remove console.log statements, organize imports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 (Single Selection) → US4 (Visual Feedback) → US2 (Box Selection) → US3 (Additive Selection) → US5 (Multi-Scale)
  - US1 + US4 form the minimum viable MVP
  - US2 can start after US1 is complete (shares selectAt logic)
  - US3 extends US1 and US2 (requires both to be functional)
  - US5 is orthogonal and can be implemented once core selection works
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational phase - No dependencies on other stories
- **User Story 4 (P1)**: Can start in parallel with US1 - Independently testable
- **User Story 2 (P1)**: Depends on US1 (uses same SelectionSystem foundation)
- **User Story 3 (P2)**: Depends on US1 and US2 (extends both with Shift key)
- **User Story 5 (P2)**: Depends on US1 at minimum (needs basic selection working first)

### Within Each User Story

- Refactoring tasks before new implementations
- System logic before input handling
- Input handling before integration in main.ts
- Core implementation before edge cases

### Parallel Opportunities

- Phase 1 (Setup): T001, T002 can run in parallel
- Phase 2 (Foundational): T005, T006 can run in parallel (different files)
- Phase 3 (US1): T009, T010 can run in parallel (same file, different methods)
- Phase 4 (US4): T019 can start as soon as Phase 2 completes (independent file)
- Phase 5 (US2): T027, T028 can run in parallel (same file, different methods)
- Phase 6 (US3): T036, T037 can run in parallel (same file, different methods)
- Phase 7 (US5): T042, T044, T045, T046 can run in parallel (testing different scales)
- Phase 8 (Polish): T048, T049, T050 can run in parallel (different files)

---

## Parallel Example: Foundational Phase

```bash
# Launch foundational tasks in parallel:
Task T005: "Create SelectionStateComponent.ts" (NEW FILE)
Task T006: "Create SelectionBox.ts" (NEW FILE)

# Then sequential:
Task T004: "Refactor SelectableComponent.ts" (modify existing)
Task T007: "Initialize SelectionStateComponent in main.ts"
Task T008: "Add getCurrentViewScale() to SceneManager.ts"
```

---

## Parallel Example: User Story 1

```bash
# Launch selection logic tasks in parallel:
Task T009: "Implement SelectionSystem.selectAt()" (new method)
Task T010: "Implement SelectionSystem.clearSelection()" (new method)

# Then sequential refactoring:
Task T011: "Add ownership filtering to selectAt()"
Task T012: "Add ViewScale filtering to selectAt()"
Task T013: "Update SelectionSystem to use SelectionStateComponent"

# Then input handler (new file, can be parallel with above):
Task T014: "Create SelectionInputHandler.ts"
Task T015: "Add screenToNDC() helper"
Task T016: "Connect to SelectionSystem.selectAt()"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 4 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) ⚠️ CRITICAL GATE
3. Complete Phase 3: User Story 1 (T009-T018) - Single unit selection
4. Complete Phase 4: User Story 4 (T019-T026) - Visual feedback
5. **STOP and VALIDATE**: Click units, verify green circles appear
6. Deploy/demo if ready (minimum viable selection system)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready ✅
2. Add US1 (Single Selection) → Test independently → **MVP Checkpoint 1**
3. Add US4 (Visual Feedback) → Test independently → **MVP Checkpoint 2** (Deploy!)
4. Add US2 (Box Selection) → Test independently → Enhanced selection (Deploy!)
5. Add US3 (Additive Selection) → Test independently → Full RTS controls (Deploy!)
6. Add US5 (Multi-Scale) → Test independently → Complete feature (Deploy!)
7. Polish (Phase 8) → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T008)
2. Once Foundational is done:
   - Developer A: User Story 1 (T009-T018) - Single selection logic
   - Developer B: User Story 4 (T019-T026) - Visual rendering
   - Developers sync when both complete
3. Then proceed:
   - Developer A: User Story 2 (T027-T035) - Box selection
   - Developer B: User Story 3 (T036-T041) - Additive selection
   - Developer C: User Story 5 (T042-T047) - Multi-scale support
4. All converge for Polish (Phase 8)

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 5 tasks ⚠️ BLOCKS ALL STORIES
- **Phase 3 (US1 - Single Selection)**: 10 tasks 🎯 MVP PRIORITY
- **Phase 4 (US4 - Visual Feedback)**: 8 tasks 🎯 MVP PRIORITY
- **Phase 5 (US2 - Box Selection)**: 9 tasks
- **Phase 6 (US3 - Additive Selection)**: 6 tasks
- **Phase 7 (US5 - Multi-Scale)**: 6 tasks
- **Phase 8 (Polish)**: 13 tasks

**Total**: 60 tasks

**MVP Scope** (US1 + US4): 26 tasks (Setup + Foundational + US1 + US4)
**Full Feature**: 60 tasks (all phases)

---

## File Path Reference

### Files to REFACTOR (already exist):
- src/ecs/components/SelectableComponent.ts
- src/ecs/systems/SelectionSystem.ts
- src/ui/input/MovementController.ts (integration only)
- src/core/renderer/SceneManager.ts (add getCurrentViewScale method)
- src/main.ts (integration)

### Files to CREATE (new):
- src/ecs/components/SelectionStateComponent.ts
- src/ecs/systems/SelectionRenderSystem.ts
- src/ui/input/SelectionInputHandler.ts
- src/ui/components/SelectionBox.ts

### Contract References:
- specs/011-rts-unit-selection/contracts/SelectionSystem.interface.ts
- specs/011-rts-unit-selection/contracts/SelectionRenderSystem.interface.ts
- specs/011-rts-unit-selection/contracts/InputHandler.interface.ts
- specs/011-rts-unit-selection/contracts/SelectionBox.interface.ts

### Documentation:
- specs/011-rts-unit-selection/plan.md (architecture reference)
- specs/011-rts-unit-selection/data-model.md (component schemas)
- specs/011-rts-unit-selection/quickstart.md (usage examples)
- specs/011-rts-unit-selection/research.md (technical decisions)

---

## Notes

- [P] tasks = different files or independent methods, no execution dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of parallel tasks
- Stop at any checkpoint to validate story independently
- Verify each phase completion before proceeding to next phase
- MVP = US1 + US4 (single selection + visual feedback)
- Full feature = All 5 user stories + polish

**CRITICAL REMINDERS**:
- Phase 2 (Foundational) MUST complete before ANY user story work
- US1 is the foundation for US2 and US3
- US4 can be implemented in parallel with US1
- Tests are NOT included - focus on core functionality first
- Follow contract interfaces strictly for public APIs
