import { World } from '../../common/ecs/World';
import { EconomySystem } from '../../common/ecs/systems/EconomySystem';
import { LogisticsSystem } from '../../common/ecs/systems/LogisticsSystem';
import { CombatSystem } from '../../common/ecs/systems/CombatSystem';
import { SovereigntySystem } from '../../common/ecs/systems/SovereigntySystem';

export class ServerWorld extends World {
  constructor() {
    super();
    this.addSystem(EconomySystem);
    this.addSystem(LogisticsSystem);
    this.addSystem(CombatSystem);
    this.addSystem(SovereigntySystem);
  }
}
