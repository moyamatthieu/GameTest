# Tasks: Serveur de Persistance de Secours + Hébergement

**Feature**: `001-p2p-persistence-server` | **Status**: In Progress
**Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

## Implementation Strategy

1.  **Verify Backend**: Ensure the existing Node.js server correctly implements signature verification, storage, and static serving.
2.  **Client-Side Client**: Implement a `PersistenceClient` to handle HTTP communication with the server.
3.  **Integration**: Connect the client to the game loop for periodic backups and to the connection manager for restoration.
4.  **UI & Feedback**: Provide visual feedback to the user about the persistence status.
5.  **TDD/Testing**: Validate each step with unit and integration tests.

## Phase 1: Setup & Backend Verification
*Goal: Ensure the server infrastructure is solid and compliant with the spec.*

- [x] T001 Verify `server/package.json` and `server/tsconfig.json` for correct dependencies and build settings
- [x] T002 Verify server entry point in `server/src/index.ts` and ensure all routes are registered
- [x] T003 [P] Verify Ed25519 verification logic in `server/src/crypto/verify.ts`
- [x] T004 [P] Verify filesystem storage and retention logic in `server/src/storage/snapshotStore.ts`
- [x] T005 [P] Verify rate limiting implementation in `server/src/http/rateLimit.ts`

## Phase 2: Foundational (TDD & Utilities)
*Goal: Setup testing environment and shared utilities.*

- [x] T006 Setup Vitest for server-side unit tests in `server/vitest.config.ts`
- [x] T007 [P] Implement unit tests for signature verification in `server/tests/unit/crypto.test.ts`
- [x] T008 [P] Implement unit tests for snapshot storage and pruning in `server/tests/unit/storage.test.ts`
- [x] T025 Implement `serialize()` and `deserialize()` methods in `src/ecs/World.ts` to support state persistence

## Phase 3: User Story 1 - Charger le jeu depuis le serveur
*Goal: Ensure the game can be loaded via the server's static file hosting.*

- [x] T009 [US1] Verify static file serving logic in `server/src/static/serveStatic.ts`
- [x] T010 [US1] Run and validate smoke tests for static serving in `server/scripts/smoke-test.ts`
- [x] T011 [US1] Verify that `index.html` and assets are correctly served when visiting the root URL

## Phase 4: User Story 2 - Sauvegarde de secours signée
*Goal: Implement client-side logic to send signed snapshots to the server.*

- [x] T012 [US2] Implement `PersistenceClient` class in `src/core/network/PersistenceClient.ts` for POSTing snapshots and journal entries
- [x] T013 [US2] Implement snapshot and journal signing logic in `src/core/network/PersistenceClient.ts` using `tweetnacl`
- [x] T014 [US2] Integrate `PersistenceClient` into `src/main.ts` to trigger periodic backups (e.g., every 5 mins)
- [x] T015 [US2] [P] Add unit tests for `PersistenceClient` in `tests/unit/core/network/PersistenceClient.test.ts`
- [x] T016 [US2] Verify that the server correctly accepts and stores signed snapshots and journal entries
- [x] T026 [US2] Implement journal append route (POST /persistence/journal) in `server/src/routes/persistence.ts`

## Phase 5: User Story 3 - Restauration après extinction totale P2P
*Goal: Implement restoration logic when no P2P peers are available.*

- [x] T017 [US3] Implement snapshot retrieval method in `src/core/network/PersistenceClient.ts`
- [x] T018 [US3] Update `src/core/network/ConnectionManager.ts` to attempt restoration from server if peer count is 0
- [x] T019 [US3] Implement state application logic in `src/core/sync/SyncService.ts` using `World.deserialize()`
- [x] T020 [US3] [P] Create integration test for the full backup/restore flow in `tests/integration/persistence-server/backup-restore.spec.ts`

## Phase 6: Polish & Cross-cutting Concerns
*Goal: UI feedback and final refinements.*

- [x] T021 Implement persistence status indicator in `src/ui/overlay.html`
- [x] T022 Update UI components to show "Backup Synced" or "Restored from Server" status
- [x] T024 Final end-to-end manual verification of the persistence safety net

## Dependencies

- **Story Completion Order**: US1 → US2 → US3
- **T012 (Client)** depends on **T002 (Server Route)**
- **T018 (Restoration)** depends on **T017 (Retrieval)** and **T019 (State Application)**

## Parallel Execution Examples

- **Backend Verification**: T003, T004, T005 can be done in parallel.
- **Unit Testing**: T007, T008 can be done in parallel.
- **Client Implementation**: T015 (Tests) can be written in parallel with T012 (Implementation).

## Implementation Strategy

- **MVP First**: Focus on US1 (Static serving) and US2 (Upload) to ensure data is being backed up.
- **Incremental Delivery**: US3 (Restore) can be added once the backup mechanism is proven reliable.
- **Security First**: Ensure signature verification is robust before exposing the upload endpoint to the public.
