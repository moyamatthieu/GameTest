import { jest } from '@jest/globals';
import { World } from '../../../common/ecs/World.js';
import {
  Position,
  Velocity,
  Identity,
  ComponentTypes
} from '../../../common/ecs/components.js';

describe('World ECS', () => {
  let world;

  beforeEach(() => {
    world = new World();
  });

  describe('Entity Creation', () => {
    test('should create entity with auto-generated ID', () => {
      const entity = world.createEntity();
      expect(entity).toBe(0);
      expect(world.entities.has(entity)).toBe(true);
    });

    test('should create entity with requested ID', () => {
      const entity = world.createEntity(100);
      expect(entity).toBe(100);
      expect(world.entities.has(entity)).toBe(true);
      expect(world.nextEntityId).toBe(101);
    });

    test('should create multiple entities with sequential IDs', () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      expect(e1).toBe(0);
      expect(e2).toBe(1);
      expect(e3).toBe(2);
      expect(world.entities.size).toBe(3);
    });
  });

  describe('Entity Destruction', () => {
    test('should destroy entity and remove all components', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position(10, 20));
      world.addComponent(entity, 'Velocity', Velocity(1, 0));

      world.destroyEntity(entity);

      expect(world.entities.has(entity)).toBe(false);
      expect(world.entityMasks.has(entity)).toBe(false);
      expect(world.getComponent(entity, 'Position')).toBeUndefined();
    });

    test('should remove entity from queries when destroyed', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position());
      world.addComponent(entity, 'Velocity', Velocity());

      const entities = world.getEntitiesWith('Position', 'Velocity');
      expect(entities).toContain(entity);

      world.destroyEntity(entity);

      const entitiesAfter = world.getEntitiesWith('Position', 'Velocity');
      expect(entitiesAfter).not.toContain(entity);
    });
  });

  describe('Component Management', () => {
    test('should add component to entity', () => {
      const entity = world.createEntity();
      const pos = Position(10, 20, 30);
      world.addComponent(entity, 'Position', pos);

      expect(world.hasComponent(entity, 'Position')).toBe(true);
      expect(world.getComponent(entity, 'Position')).toEqual(pos);
    });

    test('should update entity bitmask when adding component', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position());

      const mask = world.entityMasks.get(entity);
      expect(mask & ComponentTypes.Position).toBe(ComponentTypes.Position);
    });

    test('should remove component from entity', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position());
      world.addComponent(entity, 'Velocity', Velocity());

      world.removeComponent(entity, 'Position');

      expect(world.hasComponent(entity, 'Position')).toBe(false);
      expect(world.hasComponent(entity, 'Velocity')).toBe(true);
    });

    test('should update entity bitmask when removing component', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position());
      world.addComponent(entity, 'Velocity', Velocity());

      const maskBefore = world.entityMasks.get(entity);
      world.removeComponent(entity, 'Position');
      const maskAfter = world.entityMasks.get(entity);

      expect(maskBefore & ComponentTypes.Position).toBe(ComponentTypes.Position);
      expect(maskAfter & ComponentTypes.Position).toBe(0);
    });

    test('should return null for non-existent component', () => {
      const entity = world.createEntity();
      expect(world.getComponent(entity, 'Position')).toBeNull();
    });
  });

  describe('Queries with Bitmasks', () => {
    test('should query entities with single component', () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, 'Position', Position());
      world.addComponent(e2, 'Position', Position());
      world.addComponent(e3, 'Velocity', Velocity());

      const entities = world.getEntitiesWith('Position');
      expect(entities).toContain(e1);
      expect(entities).toContain(e2);
      expect(entities).not.toContain(e3);
    });

    test('should query entities with multiple components', () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, 'Position', Position());
      world.addComponent(e1, 'Velocity', Velocity());

      world.addComponent(e2, 'Position', Position());
      world.addComponent(e2, 'Velocity', Velocity());

      world.addComponent(e3, 'Position', Position());

      const entities = world.getEntitiesWith('Position', 'Velocity');
      expect(entities).toContain(e1);
      expect(entities).toContain(e2);
      expect(entities).not.toContain(e3);
    });

    test('should cache query results', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position());
      world.addComponent(entity, 'Velocity', Velocity());

      const mask = ComponentTypes.Position | ComponentTypes.Velocity;
      world.getEntitiesWith('Position', 'Velocity');

      expect(world.queries.has(mask)).toBe(true);
    });

    test('should update query cache when entity changes', () => {
      const e1 = world.createEntity();
      world.addComponent(e1, 'Position', Position());

      const entitiesBefore = world.getEntitiesWith('Position', 'Velocity');
      expect(entitiesBefore).not.toContain(e1);

      world.addComponent(e1, 'Velocity', Velocity());

      const entitiesAfter = world.getEntitiesWith('Position', 'Velocity');
      expect(entitiesAfter).toContain(e1);
    });

    test('should remove entity from query when component removed', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position());
      world.addComponent(entity, 'Velocity', Velocity());

      const entitiesBefore = world.getEntitiesWith('Position', 'Velocity');
      expect(entitiesBefore).toContain(entity);

      world.removeComponent(entity, 'Velocity');

      const entitiesAfter = world.getEntitiesWith('Position', 'Velocity');
      expect(entitiesAfter).not.toContain(entity);
    });
  });

  describe('Performance Tests', () => {
    test('should handle 10000 entities efficiently', () => {
      const start = performance.now();

      // Create 10000 entities with components
      for (let i = 0; i < 10000; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, 'Position', Position(i, i * 2));
        world.addComponent(entity, 'Velocity', Velocity(i * 0.1, 0));
      }

      const creationTime = performance.now() - start;
      expect(creationTime).toBeLessThan(100); // Should be fast

      // Query should be fast too
      const queryStart = performance.now();
      const entities = world.getEntitiesWith('Position', 'Velocity');
      const queryTime = performance.now() - queryStart;

      expect(entities.length).toBe(10000);
      expect(queryTime).toBeLessThan(10); // Query should be very fast
    });

    test('should maintain query performance with many component changes', () => {
      // Create entities
      const entities = [];
      for (let i = 0; i < 1000; i++) {
        const e = world.createEntity();
        world.addComponent(e, 'Position', Position());
        entities.push(e);
      }

      const start = performance.now();

      // Add velocity component to all entities
      for (const e of entities) {
        world.addComponent(e, 'Velocity', Velocity());
      }

      const time = performance.now() - start;
      expect(time).toBeLessThan(50); // Should be fast

      // Verify query still works
      const result = world.getEntitiesWith('Position', 'Velocity');
      expect(result.length).toBe(1000);
    });
  });

  describe('Systems', () => {
    test('should register and execute systems', () => {
      const mockSystem = jest.fn();
      world.addSystem(mockSystem);

      world.update(16.67);

      expect(mockSystem).toHaveBeenCalledWith(world, 16.67);
    });

    test('should execute multiple systems in order', () => {
      const calls = [];
      const system1 = (world, dt) => calls.push('system1');
      const system2 = (world, dt) => calls.push('system2');

      world.addSystem(system1);
      world.addSystem(system2);
      world.update(16.67);

      expect(calls).toEqual(['system1', 'system2']);
    });
  });

  describe('Event Callbacks', () => {
    test('should call onEntityAdded callback', () => {
      const callback = jest.fn();
      world.onEntityAdded = callback;

      const entity = world.createEntity();

      expect(callback).toHaveBeenCalledWith(entity);
    });

    test('should call onEntityRemoved callback', () => {
      const callback = jest.fn();
      world.onEntityRemoved = callback;

      const entity = world.createEntity();
      world.destroyEntity(entity);

      expect(callback).toHaveBeenCalledWith(entity);
    });
  });
});
