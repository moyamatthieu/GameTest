# Implementation Plan: P2P State Sync

**Branch**: `003-p2p-state-sync` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-p2p-state-sync/spec.md`

## Summary

Synchronisation en temps réel de la position et de la rotation des vaisseaux entre les pairs via PeerJS. L'approche technique repose sur un `SyncService` qui diffuse l'état local à intervalle régulier et un `RemotePlayerManager` qui gère le cycle de vie des vaisseaux distants dans la scène Three.js.

## Technical Context

**Language/Version**: TypeScript (ESNext)
**Primary Dependencies**: PeerJS, Three.js
**Storage**: N/A (État transitoire en mémoire)
**Testing**: Vitest (Unitaires pour la sérialisation, Intégration pour le flux de données)
**Target Platform**: Web Browser
**Project Type**: Single project (Web)
**Performance Goals**: 60 fps (rendu), <100ms intervalle de sync, supporte 10+ pairs
**Constraints**: Architecture P2P pure (pas de serveur d'état), latence réseau variable
**Scale/Scope**: Synchronisation de base (position/rotation) sans interpolation avancée pour cette phase.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. P2P Architecture | ✅ PASS | Utilise PeerJS pour les connexions directes. |
| II. Spatial Hierarchy | ✅ PASS | S'applique à l'échelle Micro (vaisseaux). |
| III. Physical Resources | N/A | Pas encore implémenté dans cette feature. |
| IV. Tech Progression | N/A | Pas encore implémenté. |
| V. Governance | N/A | Pas encore implémenté. |
| VI. Fog of War | ⚠️ WARN | La sync est temps réel pour les pairs connectés, ce qui est cohérent avec la proximité. |

## Project Structure

### Documentation (this feature)

```text
specs/003-p2p-state-sync/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── state-sync.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── sync/
│   │   ├── SyncService.ts           # Orchestration de la sync
│   │   ├── RemotePlayerManager.ts   # Gestion des vaisseaux distants
│   │   └── types.ts                 # Types spécifiques à la sync
│   ├── network/
│   │   └── ConnectionManager.ts     # (Existant) Utilisé pour l'envoi
│   └── renderer/
│       └── Renderer.ts              # (Existant) Utilisé pour le rendu
tests/
├── unit/
│   └── core/
│       └── sync/
│           └── SyncService.test.ts
├── integration/
│   └── sync/
│       └── DataFlow.test.ts
```

**Structure Decision**: Centralisation de la logique de synchronisation dans `src/core/sync` pour séparer le réseau pur (`network`) du rendu pur (`renderer`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations identified. The design strictly follows the P2P architecture defined in the current constitution.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
