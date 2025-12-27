# Tasks: 001-p2p-peerjs-connection

**Input**: Design documents from `specs/001-p2p-peerjs-connection/`
**Prerequisites**: [plan.md](specs/001-p2p-peerjs-connection/plan.md), [spec.md](specs/001-p2p-peerjs-connection/spec.md), [research.md](specs/001-p2p-peerjs-connection/research.md), [data-model.md](specs/001-p2p-peerjs-connection/data-model.md), [contracts/p2p-messages.md](specs/001-p2p-peerjs-connection/contracts/p2p-messages.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure in `src/core/identity`, `src/core/network`, and `src/ui/components` per [plan.md](specs/001-p2p-peerjs-connection/plan.md)
- [X] T002 Install dependencies: `peerjs`, `tweetnacl`, `bs58` and dev dependencies `@types/peerjs`, `@types/tweetnacl`
- [X] T003 [P] Configure Vitest for unit/integration tests and Playwright for E2E tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T004 Define `Identity` and `PeerConnection` types in `src/core/identity/types.ts` and `src/core/network/types.ts` per [data-model.md](specs/001-p2p-peerjs-connection/data-model.md)
- [X] T005 [P] Define `P2PMessage` interface and message types in `src/core/network/contracts.ts` per [p2p-messages.md](specs/001-p2p-peerjs-connection/contracts/p2p-messages.md)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Génération d'Identité Unique (Priority: P1) 🎯 MVP

**Goal**: Generate a unique Ed25519 identity and persist it in localStorage.

**Independent Test**: Open the app, see a Peer ID. Refresh the page, the Peer ID must remain the same.

### Tests for User Story 1

- [X] T006 [P] [US1] Create unit tests for `IdentityManager` in `tests/unit/identity/IdentityManager.test.ts` (generation, persistence, derivation)

### Implementation for User Story 1

- [X] T007 [US1] Implement `IdentityManager` in `src/core/identity/IdentityManager.ts` using `tweetnacl` and `bs58`
- [X] T008 [US1] Integrate `IdentityManager` in `src/main.ts` to initialize identity on startup and log the Peer ID

**Checkpoint**: User Story 1 is functional. Identity is generated and persisted.

---

## Phase 4: User Story 2 - Connexion à un Pair (Priority: P1)

**Goal**: Establish a P2P connection between two users using PeerJS.

**Independent Test**: Open two browser windows. Copy ID from A to B. Connect. Both show "Connected".

### Tests for User Story 2

- [X] T009 [P] [US2] Create unit tests for `PeerService` (mocking PeerJS) in `tests/unit/network/PeerService.test.ts`
- [X] T010 [P] [US2] Create E2E test for P2P connection in `tests/e2e/connection.spec.ts` using multi-context Playwright

### Implementation for User Story 2

- [X] T011 [US2] Implement `PeerService` in `src/core/network/PeerService.ts` to wrap PeerJS lifecycle
- [X] T012 [US2] Implement `ConnectionManager` in `src/core/network/ConnectionManager.ts` to manage multiple `DataConnection`
- [X] T013 [US2] Create `NetworkStatus` UI component in `src/ui/components/NetworkStatus.tsx` with ID display and connection input

**Checkpoint**: User Story 2 is functional. Two peers can connect via WebRTC.

---

## Phase 5: User Story 3 - Vérification de la Communication (Priority: P2)

**Goal**: Send and receive test messages (CHAT) between connected peers.

**Independent Test**: Once connected, send "Hello" from A. B should display "Hello".

### Tests for User Story 3

- [X] T014 [P] [US3] Create integration test for message exchange in `tests/integration/network/messaging.test.ts`

### Implementation for User Story 3

- [X] T015 [US3] Implement message sending and event-based receiving in `src/core/network/PeerService.ts`
- [X] T016 [US3] Update `NetworkStatus.tsx` to include a simple message log and input field for testing communication

**Checkpoint**: User Story 3 is functional. Data exchange is verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and final validation

- [X] T017 [P] Update `README.md` and `quickstart.md` with final implementation details
- [X] T018 Code cleanup and ensure all tests pass (`npm test` and `npx playwright test`)
- [X] T019 [P] Add error handling for "ID already taken" and "Peer offline" scenarios in `src/core/network/PeerService.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001, T002.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs Identity).
- **User Story 3 (Phase 5)**: Depends on Phase 4 (needs Connection).
- **Polish (Phase 6)**: Depends on all stories.

### Parallel Opportunities

- T003 (Config) can run with T001/T002.
- T005 (Contracts) can run with T004 (Types).
- T006 (US1 Tests) can run before T007 (US1 Impl).
- T009, T010 (US2 Tests) can run before T011 (US2 Impl).
- T014 (US3 Tests) can run before T015 (US3 Impl).

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundation.
2. Implement Identity Generation (US1).
3. Implement Basic Connection (US2).
4. **Validate**: Use the simple UI to connect two tabs.

### Incremental Delivery

1. **Increment 1**: Identity persistence (US1).
2. **Increment 2**: WebRTC Connection (US2).
3. **Increment 3**: Message Exchange (US3).
