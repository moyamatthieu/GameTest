import { describe, it, expect } from 'vitest';
import { WorldGenerator } from '../../../../src/core/world/WorldGenerator';
describe('WorldGenerator', () => {
    it('should generate a universe with 100 clusters', () => {
        const generator = new WorldGenerator(12345);
        const universe = generator.generateUniverse();
        expect(universe.clusters.length).toBe(100);
        expect(universe.seed).toBe(12345);
    });
    it('should be deterministic', () => {
        const gen1 = new WorldGenerator(12345);
        const gen2 = new WorldGenerator(12345);
        const uni1 = gen1.generateUniverse();
        const uni2 = gen2.generateUniverse();
        expect(uni1).toEqual(uni2);
    });
    it('should generate 10 systems per cluster', () => {
        const generator = new WorldGenerator(12345);
        const universe = generator.generateUniverse();
        universe.clusters.forEach(cluster => {
            expect(cluster.systems.length).toBe(10);
        });
    });
    it('should generate 1-10 planets per system', () => {
        const generator = new WorldGenerator(12345);
        const universe = generator.generateUniverse();
        universe.clusters[0].systems.forEach(system => {
            expect(system.planets.length).toBeGreaterThanOrEqual(1);
            expect(system.planets.length).toBeLessThanOrEqual(10);
        });
    });
});
//# sourceMappingURL=WorldGenerator.test.js.map