# Tasks: 008-ui-hud

**Input**: Design documents from `specs/008-ui-hud/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md)

## Phase 1: Setup & Styles

- [ ] T001 Create directory structure for UI components in `src/ui/components/`
- [ ] T002 Create `src/ui/styles/hud.css` with base styles for HUD elements (absolute positioning, z-index, colors)
- [ ] T003 [P] Define `HUDState` and `RadarEntity` types in `src/ui/types.ts`

---

## Phase 2: User Story 1 - Health Bar (Priority: P1)

- [ ] T004 [US1] Create `src/ui/components/HealthBar.ts` to manage the health bar DOM element
- [ ] T005 [US1] Implement update logic in `HealthBar.ts` to change width/color based on HP percentage
- [ ] T006 [US1] Integrate `HealthBar` into `SelectionManager` or a UI manager to show health of selected entities

---

## Phase 3: User Story 2 - Crosshair (Priority: P1)

- [ ] T007 [US2] Create `src/ui/components/Crosshair.ts` to render a fixed reticle at the center of the screen
- [ ] T008 [US2] Add CSS styles for the crosshair in `hud.css` (centering using `top: 50%; left: 50%; transform: translate(-50%, -50%)`)

---

## Phase 4: User Story 3 - 2D Radar (Priority: P2)

- [ ] T009 [US3] Create `src/ui/components/Radar.ts` with a circular background
- [ ] T010 [US3] Implement the projection logic: convert 3D world coordinates to 2D radar coordinates relative to the player
- [ ] T011 [US3] Implement rendering of dots: Gray for planets, Red for remote players, White for self
- [ ] T012 [US3] Add update loop to `Radar.ts` to refresh positions every frame

---

## Phase 5: User Story 4 - Target Info (Priority: P2)

- [ ] T013 [US4] Create `src/ui/components/TargetInfo.ts` to display target name and HP
- [ ] T014 [US4] Implement a simple event listener or state check to update `TargetInfo` when a target is hit
- [ ] T015 [US4] Add CSS for the target info panel (top-left or bottom-right)

---

## Phase 6: Integration & Polish

- [ ] T016 Create `src/ui/components/HUD.ts` as a container/manager for all HUD components
- [ ] T017 Ensure the HUD is responsive to window resizing
- [ ] T018 [P] Add unit tests for radar projection logic in `tests/unit/ui/Radar.test.ts`
- [ ] T019 Final visual polish and alignment with Principle VI (Vanilla HTML/CSS)
