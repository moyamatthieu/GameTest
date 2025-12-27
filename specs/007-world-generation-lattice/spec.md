# Feature Specification: World Generation (Lattice)

**Feature Branch**: `007-world-generation-lattice`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "Create a deterministic world generator using a seed, with a 10x10 grid of Clusters, 10 Systems per Cluster, and 1-10 Planets per System. Include data structures, Three.js visualization, and basic navigation."

## User Scenarios & Testing

### User Story 1 - Deterministic Universe Generation (Priority: P1)

As a player, I want the universe to be generated identically every time I use the same seed, so that all players in a shared session see the exact same world structure, including cluster centers and galactic routes.

**Why this priority**: Essential for P2P consistency.

**Independent Test**: 
1. Initialize the generator with seed "ALFA-1".
2. Verify Cluster (0,0) has the same center stars and routes to neighbors.
3. Verify Planet (0,0,0) has the same heightmap-based resource distribution.

---

### User Story 2 - Multi-Scale Visualization (Priority: P1)

As a player, I want to switch between Galaxy, System, and Planet views, with each view showing the appropriate level of detail (routes in galaxy, orbits in system, relief on planets).

**Why this priority**: Core navigation mechanic defined in the Constitution.

**Independent Test**:
1. Start in Galaxy view: see clusters and routes.
2. Zoom into a system: see sun and planets.
3. Zoom into a planet: see spherical surface with relief.

---

### User Story 3 - Resource Distribution (Priority: P2)

As a player, I want to find basic resources near cluster centers and rare resources in the periphery, so that I can plan my expansion strategically.

**Why this priority**: Drives the game's economy and exploration.

**Independent Test**:
1. Scan a planet near a cluster center: high Iron/Copper density.
2. Scan a planet at the cluster edge: high Uranium/Rare Earths density.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST use a seeded PRNG for all generation (Lattice, Heightmaps, Routes).
- **FR-002**: The universe MUST be a 10x10 grid of Clusters, each with 10 Systems.
- **FR-003**: Each Cluster MUST have 1-2 "Center" stars connected to adjacent cluster centers via routes.
- **FR-004**: Planet surfaces MUST be generated using multi-layer Heightmaps (Perlin noise) for relief and resources.
- **FR-005**: Resource density MUST follow the "Center vs Periphery" logic (Basic at center, Rare at edges).
- **FR-006**: The system MUST support three distinct rendering scales: Galaxy, System, Planet.
- **FR-007**: Each planet MUST have a flat "Space Construction Grid" (2x planet diameter) centered on it.

### Key Entities

- **Universe**: Root object with seed.
- **Cluster**: Container with 10 systems and designated "Centers".
- **System**: Star with orbiting planets.
- **Planet**: Spherical body with heightmaps and a flat space grid.
- **GalacticRoute**: Connection between cluster centers.
- **HeightmapLayer**: Data structure for elevation or resource density.

## Success Criteria

- Generation of the entire lattice metadata (not necessarily all entities) takes less than 100ms.
- Switching systems clears the scene and renders new planets in less than 500ms.
- Two clients using the same seed see the exact same planet count and positions in any given system.

## Assumptions

- We will use a simple PRNG like `seedrandom` or a custom LCG implementation.
- For this feature, planets are static (no orbital movement yet).
- Navigation is instantaneous (teleportation) for testing purposes.
- The "Current System" is a global state or a component on the Player entity.
