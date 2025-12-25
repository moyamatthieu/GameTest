import { World } from '../../common/ecs/World.js';
import { EconomySystem } from '../../common/ecs/systems/EconomySystem.js';
import { LogisticsSystem } from '../../common/ecs/systems/LogisticsSystem.js';
import { CombatSystem } from '../../common/ecs/systems/CombatSystem.js';
import { SovereigntySystem } from '../../common/ecs/systems/SovereigntySystem.js';

export class ServerWorld extends World {
  constructor() {
    super();
    this.addSystem(EconomySystem);
    this.addSystem(LogisticsSystem);
    this.addSystem(CombatSystem);
    this.addSystem(SovereigntySystem);
  }
}
