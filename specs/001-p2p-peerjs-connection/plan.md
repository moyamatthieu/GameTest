# Implementation Plan: 001-p2p-peerjs-connection

**Branch**: `001-p2p-peerjs-connection` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [specs/001-p2p-peerjs-connection/spec.md](specs/001-p2p-peerjs-connection/spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Mise en place de la connexion de base entre deux joueurs via PeerJS. L'approche technique repose sur la génération d'une identité cryptographique unique (Ed25519) stockée localement, servant d'identifiant pour le réseau PeerJS. La communication s'effectue via des DataChannels WebRTC pour garantir une architecture décentralisée conforme à la constitution.

## Technical Context

**Language/Version**: TypeScript (Strict)
**Primary Dependencies**: `peerjs`, `tweetnacl` (Ed25519)
**Storage**: `localStorage` (Persistance de l'identité)
**Testing**: Vitest (Unit/Integration), Playwright (E2E)
**Target Platform**: Web (Vite)
**Project Type**: Single project (Web)
**Performance Goals**: Génération d'identité < 2s, Latence P2P < 200ms
**Constraints**: Architecture décentralisée, pas de serveur central pour le gameplay
**Scale/Scope**: Support de 10-50 connexions simultanées par client

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Architecture P2P | ✅ PASS | Utilisation de PeerJS pour WebRTC direct. |
| VII. Test-First | ✅ PASS | Stratégie de test incluant Unit, Integration et E2E. |
| X. Rendu 3D Primitives | N/A | Pas d'UI 3D dans cette feature. |
| Stack: TypeScript | ✅ PASS | Utilisation de TypeScript strict. |
| Sécurité: Ed25519 | ✅ PASS | Identité basée sur paires de clés Ed25519. |

## Project Structure

### Documentation (this feature)

```text
specs/001-p2p-peerjs-connection/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── identity/
│   │   ├── IdentityManager.ts    # Gestion Ed25519 et localStorage
│   │   └── types.ts
│   └── network/
│       ├── PeerService.ts        # Abstraction PeerJS
│       └── ConnectionManager.ts  # Gestion des pairs multiples
├── ui/
│   └── components/
│       └── NetworkStatus.tsx     # Indicateur visuel d'état
└── main.ts

tests/
├── unit/
│   └── identity/
├── integration/
│   └── network/
└── e2e/
    └── connection.spec.ts
```

**Structure Decision**: Single project structure with a clear separation between `core` (logic) and `ui`. `core/identity` handles cryptographic IDs, and `core/network` handles PeerJS interactions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
