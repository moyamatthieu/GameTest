# Tasks: P2P State Sync

**Input**: Design documents from `/specs/003-p2p-state-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/state-sync.md

**Tests**: Included as requested in the feature specification (Unit and Integration).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create directory `src/core/sync/` for synchronization logic
- [x] T002 [P] Define `VesselState` and `RemotePlayer` types in `src/core/sync/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Update `src/core/network/contracts.ts` to include `STATE_UPDATE` message type and `StateUpdatePayload`
- [x] T004 Implement base `RemotePlayerManager` class in `src/core/sync/RemotePlayerManager.ts` with a `Map<string, Object3D>`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Diffusion de mon État (Priority: P1) 🎯 MVP

**Goal**: Send local vessel position and rotation to all connected peers at regular intervals.

**Independent Test**: Move the local vessel and verify in the network tab or console that `STATE_UPDATE` messages are being sent via PeerJS.

### Tests for User Story 1

- [x] T005 [P] [US1] Create unit tests for `SyncService` state extraction and message formatting in `tests/unit/core/sync/SyncService.test.ts`

### Implementation for User Story 1

- [x] T006 [US1] Implement `SyncService.broadcastLocalState()` in `src/core/sync/SyncService.ts` using `ConnectionManager`
- [x] T007 [US1] Initialize `SyncService` in `src/main.ts` and start the 100ms synchronization loop

**Checkpoint**: User Story 1 is functional - state is being broadcasted.

---

## Phase 4: User Story 2 - Rendu des Vaisseaux Distants (Priority: P1)

**Goal**: Create and update remote vessels in the Three.js scene based on received `STATE_UPDATE` messages.

**Independent Test**: Open two browser instances, connect them, and verify that a second vessel appears and moves in sync with the other instance.

### Tests for User Story 2

- [x] T008 [P] [US2] Create integration test for the full sync flow (receive message -> update scene) in `tests/integration/sync/DataFlow.test.ts`

### Implementation for User Story 2

- [x] T009 [US2] Update `RemotePlayerManager.ts` to use `PrimitiveFactory` for creating remote vessels when a new `peerId` is encountered
- [x] T010 [US2] Implement `SyncService.handleRemoteState()` to route incoming `STATE_UPDATE` messages to `RemotePlayerManager`
- [x] T011 [US2] Update `RemotePlayerManager.updatePlayerState()` to apply position and rotation to the corresponding `Object3D`

**Checkpoint**: User Story 2 is functional - remote players are visible and moving.

---

## Phase 5: User Story 3 - Gestion des Déconnexions (Priority: P2)

**Goal**: Remove remote vessels from the scene when a peer disconnects or times out.

**Independent Test**: Close one browser instance and verify that its vessel disappears from the other instance's scene.

### Implementation for User Story 3

- [x] T012 [US3] Hook `RemotePlayerManager` into `ConnectionManager`'s `peer-disconnected` event to remove vessels
- [x] T013 [US3] Implement a cleanup method in `RemotePlayerManager` that removes players whose `lastUpdate` is older than 5 seconds

**Checkpoint**: All user stories are functional and the scene remains clean.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T014 [P] Update `specs/003-p2p-state-sync/quickstart.md` with manual verification steps for state sync
- [x] T015 Perform a code review of `SyncService` and `RemotePlayerManager` for potential memory leaks (unremoved objects)
- [x] T016 Verify that the 10Hz sync interval does not negatively impact the 60fps render loop in `src/main.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001 and T002.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs messages to be sent to be received).
- **User Story 3 (Phase 5)**: Depends on Phase 4.
- **Polish (Phase 6)**: Depends on all previous phases.

### Parallel Opportunities

- T002 (Types) can be done in parallel with T001.
- T005 (US1 Tests) can be done in parallel with T006 (Implementation).
- T008 (US2 Tests) can be done in parallel with T009-T011.
- T014 (Documentation) can be done in parallel with implementation tasks.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundational phases.
2. Implement US1 to ensure data is leaving the local client.
3. Implement US2 to ensure data is being rendered on the remote client.
4. **STOP and VALIDATE**: Verify basic movement sync between two clients.

### Incremental Delivery

1. Add US3 (Cleanup) once the core sync loop is stable.
2. Finalize with Polish phase.
