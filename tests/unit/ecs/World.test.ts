import { jest } from '@jest/globals';
import { World } from '../../../common/ecs/World';
import {
  Position,
  Velocity,
  ComponentTypes
} from '../../../common/ecs/components';

describe('World ECS', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe('Entity Creation', () => {
    test('should create entity with auto-generated ID', () => {
      const entity = world.createEntity();
      expect(entity).toBe(0);
      expect((world as any).entities.has(entity)).toBe(true);
    });

    test('should create entity with requested ID', () => {
      const entity = world.createEntity(100);
      expect(entity).toBe(100);
      expect((world as any).entities.has(entity)).toBe(true);
      expect((world as any).nextEntityId).toBe(101);
    });
  });

  describe('Entity Destruction', () => {
    test('should destroy entity and remove all components', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Position', Position(10, 20));
      world.addComponent(entity, 'Velocity', Velocity(1, 0));

      world.destroyEntity(entity);

      expect((world as any).entities.has(entity)).toBe(false);
      expect((world as any).entityMasks.has(entity)).toBe(false);
      expect(world.getComponent(entity, 'Position')).toBeNull();
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

      const mask = (world as any).entityMasks.get(entity);
      expect(mask & ComponentTypes.Position).toBe(ComponentTypes.Position);
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
  });

  describe('Systems', () => {
    test('should register and execute systems', () => {
      const mockSystem = jest.fn();
      world.addSystem(mockSystem as any);

      world.update(16.67);

      expect(mockSystem).toHaveBeenCalledWith(world, 16.67);
    });
  });
});
