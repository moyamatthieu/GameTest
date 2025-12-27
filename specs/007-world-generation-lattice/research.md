# Research: World Generation (Lattice)

## Deterministic PRNG

- **Decision**: Use `seedrandom` with the **Alea** algorithm.
- **Rationale**: Industry standard for deterministic randomness in JS. Alea is optimized for performance and supports state saving/restoring, which is critical for P2P synchronization.
- **Alternatives considered**: `Mulberry32` (fast but less robust), `SplitMix32`.

## Multi-layer Heightmaps

- **Decision**: Use **Simplex Noise** (via `simplex-noise` package) with **Fractal Brownian Motion (fBm)**.
- **Rationale**: Simplex noise is faster than Perlin and has fewer artifacts. fBm (summing octaves) allows for natural-looking terrain and resource distribution.
- **Alternatives considered**: `noisejs`, custom Perlin implementation.

## Galactic Backbone Network

- **Decision**: **Relative Neighborhood Graph (RNG)** built on top of a **Minimum Spanning Tree (MST)** using Kruskal's algorithm.
- **Rationale**: MST ensures connectivity; RNG adds natural redundant paths without cluttering the view. This creates a realistic "backbone" for the 10x10 cluster grid.
- **Alternatives considered**: Delaunay Triangulation (too many edges), Simple Grid Neighbors (too artificial).

## Multi-scale Rendering

- **Decision**: **Logarithmic Depth Buffer** + **Scene Graph Layering**.
- **Rationale**: `logarithmicDepthBuffer: true` prevents z-fighting across vast scales. Layering (separate scenes for Galaxy/System/Planet) avoids floating-point jitter and allows for scale-specific optimizations.
- **Alternatives considered**: Floating Origin (complex in Three.js), Camera-Relative Rendering.
