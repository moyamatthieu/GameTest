import { World } from '../../common/ecs/World';
import { EconomySystem } from '../../common/ecs/systems/EconomySystem';
import { NetworkProtocol } from '../../server/network/Protocol';
import { Economy, Building, ProductionChain } from '../../common/ecs/components';
import { BuildingType } from '../../common/types/game';

describe('Game Loop Integration', () => {
  let world: World;
  let protocol: NetworkProtocol;

  beforeEach(() => {
    world = new World();
    world.addSystem(EconomySystem);
    protocol = new NetworkProtocol();
  });

  describe('Complete Game Loop', () => {
    test('should run full game loop with economy system', () => {
      const planet = world.createEntity();
      world.addComponent(planet, 'Economy', Economy(1000, 500, 100));

      const mine = world.createEntity();
      world.addComponent(mine, 'Building', Building(BuildingType.MINE, 2));
      world.addComponent(mine, 'ProductionChain', ProductionChain({}, { metal: 20 }, 1000));

      for (let i = 0; i < 10; i++) {
        world.update(1.0);
      }

      const economy = world.getComponent<any>(planet, 'Economy');
      expect(economy.metal).toBe(1200);
      expect(economy.energy).toBe(650);
    });
  });
});
