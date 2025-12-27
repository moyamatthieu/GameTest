# Tasks: Moteur de Rendu 3D (Three.js Primitives)

**Input**: Design documents from `specs/002-threejs-primitive-renderer/`
**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required for user stories), [research.md](research.md), [data-model.md](data-model.md), [contracts/renderer-api.md](contracts/renderer-api.md)

**Tests**: Unit tests (Vitest) and E2E tests (Playwright) are included as requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install Three.js dependencies: `npm install three` and `npm install -D @types/three`
- [x] T002 Create project structure: `src/core/renderer/`, `src/ui/components/`, `tests/unit/core/renderer/`, `tests/e2e/renderer/`
- [x] T003 [P] Define renderer types and interfaces in [src/core/renderer/types.ts](src/core/renderer/types.ts) based on [data-model.md](data-model.md) and [contracts/renderer-api.md](contracts/renderer-api.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement `SceneManager` in [src/core/renderer/SceneManager.ts](src/core/renderer/SceneManager.ts) (Scene, Camera, Lights)
- [x] T005 Implement base `Renderer` in [src/core/renderer/Renderer.ts](src/core/renderer/Renderer.ts) (WebGLRenderer, Animation Loop)
- [x] T006 Create `GameCanvas` UI component in [src/ui/components/GameCanvas.ts](src/ui/components/GameCanvas.ts) to host the renderer canvas

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Visualisation de l'Espace (Priority: P1) 🎯 MVP

**Goal**: Display a starfield background, a reference grid, and enable camera controls.

**Independent Test**: Open the app and see a black background with stars and a central grid. Rotate the view using the mouse.

### Tests for User Story 1

- [x] T007 [P] [US1] Create unit test for `Starfield` in [tests/unit/core/renderer/Starfield.test.ts](tests/unit/core/renderer/Starfield.test.ts)
- [x] T008 [P] [US1] Create E2E test for space visualization in [tests/e2e/renderer/space.spec.ts](tests/e2e/renderer/space.spec.ts)

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement `Starfield` using `THREE.Points` in [src/core/renderer/Starfield.ts](src/core/renderer/Starfield.ts)
- [x] T010 [US1] Add `Starfield` and `GridHelper` to `SceneManager` in [src/core/renderer/SceneManager.ts](src/core/renderer/SceneManager.ts)
- [x] T011 [US1] Integrate `OrbitControls` into `Renderer` in [src/core/renderer/Renderer.ts](src/core/renderer/Renderer.ts)

**Checkpoint**: User Story 1 is functional. Space environment is visible and navigable.

---

## Phase 4: User Story 2 - Affichage d'un Vaisseau Simple (Priority: P1)

**Goal**: Render a ship composed of geometric primitives (cube, cone) with basic rotation.

**Independent Test**: A multi-colored ship appears at the center and rotates slowly.

### Tests for User Story 2

- [x] T012 [P] [US2] Create unit test for `PrimitiveFactory` in [tests/unit/core/renderer/PrimitiveFactory.test.ts](tests/unit/core/renderer/PrimitiveFactory.test.ts)
- [ ] T013 [P] [US2] Create E2E test for ship rendering in [tests/e2e/renderer/ship.spec.ts](tests/e2e/renderer/ship.spec.ts)

### Implementation for User Story 2

- [x] T014 [P] [US2] Implement `PrimitiveFactory` in [src/core/renderer/PrimitiveFactory.ts](src/core/renderer/PrimitiveFactory.ts)
- [x] T015 [US2] Implement `createShip()` (ModularShip) in [src/core/renderer/PrimitiveFactory.ts](src/core/renderer/PrimitiveFactory.ts)
- [x] T016 [US2] Add ship to scene and implement light rotation in [src/core/renderer/Renderer.ts](src/core/renderer/Renderer.ts) or [src/core/renderer/SceneManager.ts](src/core/renderer/SceneManager.ts)

**Checkpoint**: User Story 2 is functional. The test ship is visible and animated.

---

## Phase 5: User Story 3 - Redimensionnement Dynamique (Priority: P2)

**Goal**: Ensure the 3D view adapts to window size changes without distortion.

**Independent Test**: Resize the browser window; the 3D scene should fill the new area immediately.

### Tests for User Story 3

- [ ] T017 [P] [US3] Create E2E test for window resize in [tests/e2e/renderer/resize.spec.ts](tests/e2e/renderer/resize.spec.ts)

### Implementation for User Story 3

- [x] T018 [US3] Implement `onResize` logic in [src/core/renderer/Renderer.ts](src/core/renderer/Renderer.ts) and [src/core/renderer/SceneManager.ts](src/core/renderer/SceneManager.ts)
- [x] T019 [US3] Add window resize event listener in [src/core/renderer/Renderer.ts](src/core/renderer/Renderer.ts)

**Checkpoint**: User Story 3 is functional. The renderer is responsive.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and cleanup.

- [ ] T020 Integrate `Renderer` and `GameCanvas` into the main entry point [src/main.ts](src/main.ts)
- [ ] T021 [P] Update [quickstart.md](quickstart.md) with final usage examples
- [ ] T022 Performance check: Ensure 60 FPS with starfield and ship
- [ ] T023 Code cleanup and final linting pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **User Stories (Phase 3-5)**: Depend on Phase 2. US1 and US2 can be done in parallel. US3 can be done anytime after Phase 2.
- **Polish (Phase 6)**: Depends on all User Stories.

### Parallel Opportunities

- T003 (Types) can be done while installing dependencies (T001).
- US1 and US2 implementation can happen in parallel as they touch different files (`Starfield.ts` vs `PrimitiveFactory.ts`).
- All test tasks marked [P] can be written in parallel with their respective implementation tasks.

---

## Parallel Example: User Story 1 & 2

```bash
# Developer A works on US1:
Task: "Implement Starfield in src/core/renderer/Starfield.ts"

# Developer B works on US2:
Task: "Implement PrimitiveFactory in src/core/renderer/PrimitiveFactory.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundation.
2. Implement US1 (Space) and US2 (Ship).
3. **VALIDATE**: Verify the ship is visible in the starfield.

### Incremental Delivery

1. Foundation ready (Phase 2).
2. Space visualization added (US1).
3. Ship rendering added (US2).
4. Responsive design added (US3).
5. Final integration (Phase 6).
