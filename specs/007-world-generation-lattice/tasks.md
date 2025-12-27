# Tasks: World Generation (Lattice)

**Input**: Design documents from `specs/007-world-generation-lattice/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan in `src/core/world/` and `src/renderer/`
- [X] T002 [P] Install dependencies: `seedrandom` and `simplex-noise` via npm

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T003 Implement deterministic PRNG wrapper using Alea in `src/core/utils/Random.ts`
- [X] T004 Define core data structures (Universe, Cluster, System, Planet) in `src/core/world/types.ts`
- [X] T005 [P] Implement `LocationComponent` for tracking entities in the lattice in `src/ecs/components/LocationComponent.ts`
- [X] T006 [P] Implement `PlanetComponent` for storing planet metadata in `src/ecs/components/PlanetComponent.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Deterministic Universe Generation (Priority: P1) 🎯 MVP

**Goal**: Generate a consistent 10x10 cluster grid with systems and routes based on a seed.

**Independent Test**: Initialize generator with seed "ALFA-1" and verify Cluster (0,0) has identical systems and routes across multiple runs.

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement `LatticeGenerator` for hierarchical metadata generation in `src/core/world/LatticeGenerator.ts`
- [X] T008 [P] [US1] Implement `RouteGenerator` using MST and RNG algorithms in `src/core/world/RouteGenerator.ts`
- [X] T009 [US1] Implement `WorldGenerator` orchestrator to tie lattice and routes together in `src/core/world/WorldGenerator.ts`
- [X] T010 [US1] Create unit test for deterministic generation consistency in `tests/unit/core/world/WorldGenerator.test.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Multi-Scale Visualization (Priority: P1)

**Goal**: Render Galaxy, System, and Planet views with appropriate detail and logarithmic depth.

**Independent Test**: Start in Galaxy view, zoom into a system, and then zoom into a planet, verifying scene transitions.

### Implementation for User Story 2

- [X] T011 [P] [US2] Implement `GalaxyRenderer` for cluster and route visualization in `src/renderer/GalaxyRenderer.ts`
- [X] T012 [P] [US2] Implement `SystemRenderer` for star and planet orbits in `src/renderer/SystemRenderer.ts`
- [X] T013 [P] [US2] Implement `PlanetRenderer` with Logarithmic Depth Buffer in `src/renderer/PlanetRenderer.ts`
- [X] T014 [US2] Implement `WorldSystem` ECS system to manage view scale transitions in `src/ecs/systems/WorldSystem.ts`
- [X] T015 [US2] Create integration test for view scale switching in `tests/integration/world/ViewSwitching.test.ts`

**Checkpoint**: User Stories 1 and 2 are functional and integrated.

---

## Phase 5: User Story 3 - Resource Distribution (Priority: P2)

**Goal**: Distribute resources on planets using heightmaps and center/periphery logic.

**Independent Test**: Verify that planets near cluster centers have higher basic resource density compared to periphery planets.

### Implementation for User Story 3

- [X] T016 [P] [US3] Implement `HeightmapGenerator` using Simplex noise and fBm in `src/core/world/HeightmapGenerator.ts`
- [X] T017 [US3] Implement resource density logic (Center vs Periphery) in `src/core/world/ResourceGenerator.ts`
- [X] T018 [US3] Update `PlanetComponent` and `WorldGenerator` to include resource data in `src/ecs/components/PlanetComponent.ts`
- [X] T019 [US3] Create unit test for resource distribution logic in `tests/unit/core/world/ResourceGenerator.test.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T020 [P] Optimize lattice generation performance to meet <100ms goal
- [X] T021 [P] Update `README.md` and `quickstart.md` with world generation details
- [X] T022 Run final validation against `specs/007-world-generation-lattice/spec.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **User Stories (Phase 3-5)**: Depend on Phase 2. US1 and US2 are P1 and should be prioritized.
- **Polish (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- T002 (Setup)
- T005, T006 (Foundational)
- T007, T008 (US1)
- T011, T012, T013 (US2)
- T016 (US3)
- T020, T021 (Polish)

---

## Parallel Example: User Story 2

```bash
# Implement renderers in parallel
Task: "Implement GalaxyRenderer in src/renderer/GalaxyRenderer.ts"
Task: "Implement SystemRenderer in src/renderer/SystemRenderer.ts"
Task: "Implement PlanetRenderer in src/renderer/PlanetRenderer.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundational phases.
2. Complete User Story 1 (Deterministic Generation).
3. Complete User Story 2 (Visualization).
4. **Validate**: Ensure a seed produces a visible, consistent universe.

### Incremental Delivery

1. Foundation -> Core Generation -> Visualization -> Resource Distribution -> Polish.
