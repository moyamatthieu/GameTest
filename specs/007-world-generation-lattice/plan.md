# Implementation Plan: World Generation (Lattice)

**Branch**: `007-world-generation-lattice` | **Date**: 2025-12-26 | **Spec**: [specs/007-world-generation-lattice/spec.md](specs/007-world-generation-lattice/spec.md)
**Input**: Feature specification from `specs/007-world-generation-lattice/spec.md`

## Summary

Implement a deterministic world generator using a seeded PRNG to create a hierarchical universe (Galaxy -> Clusters -> Systems -> Planètes). The system will support multi-scale rendering (Galaxy, System, Planet), multi-layer heightmaps for planetary relief and resource distribution, and a backbone of galactic routes connecting cluster centers.

## Technical Context

**Language/Version**: TypeScript (Strict)  
**Primary Dependencies**: Three.js, seedrandom (for PRNG), custom ECS  
**Storage**: LocalStorage (cache) + P2P Synchronization (PeerJS)  
**Testing**: Vitest (Unit & Integration)  
**Target Platform**: Web (Modern Browsers)
**Project Type**: Single project (Web)  
**Performance Goals**: <100ms for lattice metadata generation, 60 FPS rendering  
**Constraints**: Deterministic output across all clients, P2P consistency  
**Scale/Scope**: 10x10 Clusters, 10 Systems/Cluster, 1-10 Planets/System (~5000 planets total)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture P2P**: Generation is deterministic based on a shared seed (Principle I).
- [x] **Structure Spatiale Hiérarchique**: Implements Galaxy -> Cluster -> System -> Planet (Principle II).
- [x] **Économie de Ressources Physiques**: Resource distribution via heightmaps and center/periphery logic (Principle III).
- [x] **Environnements Actifs**: Only the current view (Galaxy/System/Planet) is fully loaded (Principle IX).
- [x] **Rendu 3D par Primitives**: Planets and stars use SphereGeometry; routes use Line/Cylinder (Principle X).
- [x] **Perspective RTS**: Top-down view with multi-scale zoom (Principle XII).

## Project Structure

### Documentation (this feature)

```text
specs/007-world-generation-lattice/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (to be generated)
```

### Source Code (repository root)

```text
src/
├── core/
│   └── world/
│       ├── WorldGenerator.ts
│       ├── LatticeGenerator.ts
│       ├── HeightmapGenerator.ts
│       └── RouteGenerator.ts
├── ecs/
│   ├── components/
│   │   ├── LocationComponent.ts
│   │   ├── PlanetComponent.ts
│   │   └── ResourceComponent.ts
│   └── systems/
│       └── WorldSystem.ts
└── renderer/
    ├── PlanetRenderer.ts
    ├── GalaxyRenderer.ts
    └── SystemRenderer.ts

tests/
├── unit/
│   └── core/
│       └── world/
│           └── WorldGenerator.test.ts
└── integration/
    └── world/
        └── GenerationConsistency.test.ts
```

**Structure Decision**: Single project structure as the game is a client-side P2P application.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**
