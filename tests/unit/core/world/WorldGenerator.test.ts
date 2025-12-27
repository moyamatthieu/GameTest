import { describe, it, expect } from 'vitest';
import { WorldGenerator } from '../../../../src/core/world/WorldGenerator';

describe('WorldGenerator', () => {
  it('should generate a universe with 100 clusters', () => {
    const seed = 'ALFA-1';
    const generator = new WorldGenerator(seed);
    const universe = generator.generateUniverse(seed);

    expect(universe.clusters.size).toBe(100);
    expect(universe.seed).toBe(seed);
  });

  it('should be deterministic', () => {
    const seed = 'ALFA-1';
    const gen1 = new WorldGenerator(seed);
    const gen2 = new WorldGenerator(seed);

    const uni1 = gen1.generateUniverse(seed);
    const uni2 = gen2.generateUniverse(seed);

    expect(uni1.seed).toBe(uni2.seed);
    expect(Array.from(uni1.clusters.keys())).toEqual(Array.from(uni2.clusters.keys()));

    const cluster1 = uni1.clusters.get('0,0')!;
    const cluster2 = uni2.clusters.get('0,0')!;
    expect(cluster1).toEqual(cluster2);
  });

  it('should generate 10 systems per cluster', () => {
    const seed = 'ALFA-1';
    const generator = new WorldGenerator(seed);
    const universe = generator.generateUniverse(seed);

    universe.clusters.forEach(cluster => {
      expect(cluster.systems.length).toBe(10);
    });
  });

  it('should generate 1-10 planets per system', () => {
    const seed = 'ALFA-1';
    const generator = new WorldGenerator(seed);
    const universe = generator.generateUniverse(seed);

    const firstCluster = universe.clusters.get('0,0')!;
    firstCluster.systems.forEach(system => {
      expect(system.planets.length).toBeGreaterThanOrEqual(1);
      expect(system.planets.length).toBeLessThanOrEqual(10);
    });
  });
});
