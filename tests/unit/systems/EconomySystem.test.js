import { jest } from '@jest/globals';
import { World } from '../../../common/ecs/World.js';
import { EconomySystem } from '../../../common/ecs/systems/EconomySystem.js';
import {
  Economy,
  Building,
  ProductionChain
} from '../../../common/ecs/components.js';

describe('EconomySystem', () => {
  let world;

  beforeEach(() => {
    world = new World();
    world.addSystem(EconomySystem);
  });

  describe('Basic Production', () => {
    test('should reset production values each tick', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));

      // First tick - add some production
      const economy = world.getComponent(entity, 'Economy');
      economy.production.metal = 50;
      economy.production.energy = 30;
      economy.production.credits = 20;

      world.update(1.0);

      // Production should be reset and recalculated
      expect(economy.production.metal).toBe(0);
      expect(economy.production.energy).toBe(0);
      expect(economy.production.credits).toBe(0);
    });

    test('should apply production to economy stocks', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity, 'Building', Building('mine', 2));

      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      // Mine produces 10 * level = 20 metal per second
      expect(economy.metal).toBe(120);
      expect(economy.energy).toBe(100);
      expect(economy.credits).toBe(100);
    });

    test('should handle multiple building types', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity, 'Building', Building('mine', 1));

      const entity2 = world.createEntity();
      world.addComponent(entity2, 'Economy', Economy(200, 200, 200));
      world.addComponent(entity2, 'Building', Building('centrale', 2));

      world.update(1.0);

      const economy1 = world.getComponent(entity, 'Economy');
      const economy2 = world.getComponent(entity2, 'Economy');

      // Mine level 1: 10 metal
      expect(economy1.metal).toBe(110);

      // Centrale level 2: 15 * 2 = 30 energy
      expect(economy2.energy).toBe(230);
    });
  });

  describe('Production Chains', () => {
    test('should process production chain with inputs and outputs', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100)); // Start with resources
      world.addComponent(entity, 'Building', Building('usine', 1));
      world.addComponent(entity, 'ProductionChain', ProductionChain(
        { metal: 5 }, // 5 metal per second input
        { energy: 10 }, // 10 energy per second output
        1000
      ));

      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      const productionChain = world.getComponent(entity, 'ProductionChain');

      // Should consume 5 metal and produce 10 energy
      expect(economy.metal).toBe(95);
      expect(economy.energy).toBe(110);
      expect(productionChain.status).toBe('producing');
    });

    test('should stall production when inputs are insufficient', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(2, 100, 100)); // Low metal
      world.addComponent(entity, 'Building', Building('usine', 1));
      world.addComponent(entity, 'ProductionChain', ProductionChain(
        { metal: 5 }, // Need 5 metal per second
        { energy: 10 },
        1000
      ));

      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      const productionChain = world.getComponent(entity, 'ProductionChain');

      // Should not consume or produce
      expect(economy.metal).toBe(2);
      expect(economy.energy).toBe(100);
      expect(productionChain.status).toBe('stalled_input');
    });

    test('should handle production chain with multiple inputs', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(50, 50, 100));
      world.addComponent(entity, 'Building', Building('labo', 1));
      world.addComponent(entity, 'ProductionChain', ProductionChain(
        { metal: 10, energy: 20 },
        { credits: 15 },
        1000
      ));

      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      const productionChain = world.getComponent(entity, 'ProductionChain');

      // Should consume both inputs and produce output
      expect(economy.metal).toBe(40);
      expect(economy.energy).toBe(30);
      expect(economy.credits).toBe(115);
      expect(productionChain.status).toBe('producing');
    });

    test('should stall when any input is insufficient', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(50, 10, 100)); // Low energy
      world.addComponent(entity, 'Building', Building('labo', 1));
      world.addComponent(entity, 'ProductionChain', ProductionChain(
        { metal: 10, energy: 20 },
        { credits: 15 },
        1000
      ));

      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      const productionChain = world.getComponent(entity, 'ProductionChain');

      // Should not consume anything
      expect(economy.metal).toBe(50);
      expect(economy.energy).toBe(10);
      expect(economy.credits).toBe(100);
      expect(productionChain.status).toBe('stalled_input');
    });
  });

  describe('Building States', () => {
    test('should skip inactive buildings', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));
      const building = world.getComponent(entity, 'Building', Building('mine', 1));
      building.active = false;

      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      expect(economy.metal).toBe(100); // No production
    });

    test('should handle buildings with different levels', () => {
      const entity1 = world.createEntity();
      world.addComponent(entity1, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity1, 'Building', Building('mine', 1));

      const entity2 = world.createEntity();
      world.addComponent(entity2, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity2, 'Building', Building('mine', 3));

      world.update(1.0);

      const economy1 = world.getComponent(entity1, 'Economy');
      const economy2 = world.getComponent(entity2, 'Economy');

      // Level 1: 10 metal, Level 3: 30 metal
      expect(economy1.metal).toBe(110);
      expect(economy2.metal).toBe(130);
    });
  });

  describe('Delta Time Handling', () => {
    test('should handle fractional delta time', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity, 'Building', Building('mine', 1));

      // Update with 0.5 seconds
      world.update(0.5);

      const economy = world.getComponent(entity, 'Economy');
      // Mine produces 10 * 0.5 = 5 metal
      expect(economy.metal).toBe(105);
    });

    test('should handle multiple updates correctly', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity, 'Building', Building('mine', 1));

      // Two 1-second updates
      world.update(1.0);
      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      // Should have produced 20 metal total
      expect(economy.metal).toBe(120);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex economy with multiple entities and chains', () => {
      // Create a planet economy
      const planet = world.createEntity();
      world.addComponent(planet, 'Economy', Economy(1000, 500, 100));

      // Add a mine
      const mine = world.createEntity();
      world.addComponent(mine, 'Building', Building('mine', 2));
      world.addComponent(mine, 'ProductionChain', ProductionChain(
        {},
        { metal: 20 },
        1000
      ));

      // Add a factory that uses metal to produce energy
      const factory = world.createEntity();
      world.addComponent(factory, 'Building', Building('usine', 1));
      world.addComponent(factory, 'ProductionChain', ProductionChain(
        { metal: 10 },
        { energy: 25, credits: 5 },
        1000
      ));

      world.update(1.0);

      const economy = world.getComponent(planet, 'Economy');

      // Mine produces 20 metal
      // Factory consumes 10 metal and produces 25 energy + 5 credits
      // Net: +10 metal, +25 energy, +5 credits
      expect(economy.metal).toBe(1010);
      expect(economy.energy).toBe(525);
      expect(economy.credits).toBe(105);
    });

    test('should handle resource shortage gracefully', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(5, 100, 100));
      world.addComponent(entity, 'Building', Building('usine', 1));
      world.addComponent(entity, 'ProductionChain', ProductionChain(
        { metal: 10 },
        { energy: 20 },
        1000
      ));

      // Run for 2 seconds
      world.update(1.0);
      world.update(1.0);

      const economy = world.getComponent(entity, 'Economy');
      const productionChain = world.getComponent(entity, 'ProductionChain');

      // Should not have consumed or produced (insufficient resources)
      expect(economy.metal).toBe(5);
      expect(economy.energy).toBe(100);
      expect(productionChain.status).toBe('stalled_input');
    });
  });
});
