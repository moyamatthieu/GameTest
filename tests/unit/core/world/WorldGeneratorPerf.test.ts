import { describe, it, expect } from 'vitest';
import { WorldGenerator } from '../../../../src/core/world/WorldGenerator';

describe('WorldGenerator Performance', () => {
  it('should generate the universe in less than 100ms', () => {
    const seed = 'PERF-TEST';
    const generator = new WorldGenerator(seed);

    const start = performance.now();
    generator.generateUniverse(seed);
    const end = performance.now();

    const duration = end - start;
    console.log(`Universe generation took ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(100);
  });
});
