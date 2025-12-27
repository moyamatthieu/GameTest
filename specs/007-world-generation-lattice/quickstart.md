# Quickstart: World Generation (Lattice)

## Overview

The world generation system creates a deterministic, hierarchical universe based on a single seed. It supports three view scales: Galaxy, System, and Planet.

## Usage

### 1. Initialize the Generator

```typescript
import { WorldGenerator } from './core/world/WorldGenerator';

const seed = 'MY-UNIVERSE-SEED';
const generator = new WorldGenerator(seed);
const universe = generator.generateUniverse(seed);
```

### 2. Integrate with ECS

The `WorldSystem` handles view scale transitions and lazy generation of heightmaps.

```typescript
import { WorldSystem } from './ecs/systems/WorldSystem';

const worldSystem = new WorldSystem(world, universe, sceneManager);

// In the game loop
worldSystem.update(playerLocationComponent);
```

### 3. Change View Scale

Update the `LocationComponent` of the player to trigger a view transition.

```typescript
playerLocation.viewScale = 'System';
playerLocation.systemId = 'some-system-id';
```

## Key Components

- **LatticeGenerator**: Handles the hierarchy (Cluster -> System -> Planet).
- **RouteGenerator**: Generates inter-cluster and intra-cluster routes.
- **HeightmapGenerator**: Generates planetary relief using Simplex noise and fBm.
- **ResourceGenerator**: Distributes resources based on cluster position (Center vs Periphery).
- **Renderers**: `GalaxyRenderer`, `SystemRenderer`, `PlanetRenderer` for each scale.
