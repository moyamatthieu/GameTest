import { World } from '../../../common/ecs/World';
import { EconomySystem } from '../../../common/ecs/systems/EconomySystem';
import {
  Economy,
  Building,
  ProductionChain
} from '../../../common/ecs/components';
import { BuildingType } from '../../../common/types/game';

describe('EconomySystem', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.addSystem(EconomySystem);
  });

  describe('Basic Production', () => {
    test('should apply production to economy stocks', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity, 'Building', Building(BuildingType.MINE, 2));

      world.update(1.0);

      const economy = world.getComponent<any>(entity, 'Economy');
      expect(economy.metal).toBe(120);
    });
  });

  describe('Production Chains', () => {
    test('should process production chain with inputs and outputs', () => {
      const entity = world.createEntity();
      world.addComponent(entity, 'Economy', Economy(100, 100, 100));
      world.addComponent(entity, 'Building', Building(BuildingType.USINE, 1));
      world.addComponent(entity, 'ProductionChain', ProductionChain(
        { metal: 5 },
        { energy: 10 },
        1000
      ));

      world.update(1.0);

      const economy = world.getComponent<any>(entity, 'Economy');
      expect(economy.metal).toBe(95);
      expect(economy.energy).toBe(110);
    });
  });
});
