import { IWorld, System } from '../../types/ecs';
import { EconomyData, BuildingData, ProductionChainData } from '../../types/components';
import { BuildingType } from '../../types/game';

export const EconomySystem: System = (world: IWorld, deltaTime: number) => {
  const economyEntities = world.getEntitiesWith('Economy');
  const buildingEntities = world.getEntitiesWith('Building');

  // Reset production for all economy entities
  for (const entity of economyEntities) {
    const economy = world.getComponent<EconomyData>(entity, 'Economy');
    if (economy) {
      economy.production.metal = 0;
      economy.production.energy = 0;
      economy.production.credits = 0;
    }
  }

  // Calculate production from buildings and production chains
  for (const buildingEntity of buildingEntities) {
    const building = world.getComponent<BuildingData>(buildingEntity, 'Building');
    if (!building || !building.active) continue;

    // Find the economy component this building contributes to.
    const economyEntity = economyEntities.find(e => e === buildingEntity) || economyEntities[0];
    if (economyEntity === undefined) continue;

    const economy = world.getComponent<EconomyData>(economyEntity, 'Economy');
    if (!economy) continue;

    const productionChain = world.getComponent<ProductionChainData>(buildingEntity, 'ProductionChain');

    // Default production if no chain is defined (Legacy support)
    if (!productionChain) {
      switch (building.type) {
        case BuildingType.MINE:
          economy.production.metal += 10 * building.level;
          break;
        case BuildingType.CENTRALE:
          economy.production.energy += 15 * building.level;
          break;
        case BuildingType.HABITATION:
          economy.production.credits += 5 * building.level;
          break;
      }
      continue;
    }

    // Production Chain Logic
    let canProduce = true;
    
    // Check inputs
    for (const [resource, amount] of Object.entries(productionChain.inputs)) {
      if ((economy[resource] || 0) < amount * deltaTime) {
        canProduce = false;
        productionChain.status = 'stalled_input';
        break;
      }
    }

    if (canProduce) {
      // Consume inputs
      for (const [resource, amount] of Object.entries(productionChain.inputs)) {
        economy[resource] -= amount * deltaTime;
      }

      // Produce outputs
      for (const [resource, amount] of Object.entries(productionChain.outputs)) {
        const produced = amount * deltaTime; // Continuous production
        economy.production[resource] = (economy.production[resource] || 0) + produced;
      }
      productionChain.status = 'producing';
    } else {
      productionChain.status = 'idle';
    }
  }

  // Apply production to stocks
  for (const entity of economyEntities) {
    const economy = world.getComponent<EconomyData>(entity, 'Economy');
    if (economy) {
      // Production is per second (deltaTime is in seconds)
      economy.metal += economy.production.metal * deltaTime;
      economy.energy += economy.production.energy * deltaTime;
      economy.credits += economy.production.credits * deltaTime;
    }
  }
};
