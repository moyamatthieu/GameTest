import { System } from '../System';
import { World } from '../World';
import { Position } from '../components/Position';
import { Movable } from '../components/Movable';
import { Harvester, HarvesterState } from '../components/Harvester';
import { Inventory } from '../components/Inventory';
import { ResourceNode } from '../components/ResourceNode';
import { Building, BuildingType } from '../components/Building';
import { Owner } from '../components/Owner';
import { Stockpile } from '../components/Stockpile';
import { Vector3 } from 'three';

export class HarvestSystem implements System {
  update(world: World, delta: number): void {
    const harvesters = world.getEntitiesWith(Harvester, Movable, Position, Inventory, Owner);

    for (const entity of harvesters) {
      const harvester = world.getComponent(entity, Harvester)!;
      const movable = world.getComponent(entity, Movable)!;
      const position = world.getComponent(entity, Position)!;
      const inventory = world.getComponent(entity, Inventory)!;
      const owner = world.getComponent(entity, Owner)!;

      switch (harvester.state) {
        case HarvesterState.IDLE:
          // Do nothing
          break;

        case HarvesterState.MOVING_TO_RESOURCE:
          if (harvester.targetResourceEntity === null) {
            harvester.state = HarvesterState.IDLE;
            break;
          }

          const resourcePos = world.getComponent(harvester.targetResourceEntity, Position);
          const resourceNode = world.getComponent(harvester.targetResourceEntity, ResourceNode);

          if (!resourcePos || !resourceNode || resourceNode.amount <= 0) {
            // Resource gone or empty
            harvester.state = HarvesterState.IDLE;
            movable.target = null;
            movable.isMoving = false;
            break;
          }

          // Set move target
          movable.target = new Vector3(resourcePos.x, resourcePos.y, resourcePos.z);

          // Check distance
          const distToResource = new Vector3(position.x, 0, position.z).distanceTo(new Vector3(resourcePos.x, 0, resourcePos.z));
          if (distToResource < 1.5) {
            movable.target = null;
            movable.isMoving = false;
            harvester.state = HarvesterState.HARVESTING;
          }
          break;

        case HarvesterState.HARVESTING:
          if (harvester.targetResourceEntity === null) {
             harvester.state = HarvesterState.IDLE;
             break;
          }

          const node = world.getComponent(harvester.targetResourceEntity, ResourceNode);
          if (!node || node.amount <= 0) {
             harvester.state = HarvesterState.MOVING_TO_BASE; // Return what we have
             break;
          }

          harvester.harvestTimer += delta;
          if (harvester.harvestTimer >= harvester.harvestDuration) {
            harvester.harvestTimer = 0;

            // Harvest logic
            const amountToHarvest = harvester.harvestRate;
            const actualHarvest = Math.min(amountToHarvest, node.amount);

            // Try to add to inventory
            const added = inventory.add(node.type, actualHarvest);

            // Deduct from node
            node.amount -= added;

            // If inventory full, go back
            if (inventory.currentLoad() >= inventory.capacity) {
              harvester.state = HarvesterState.MOVING_TO_BASE;
            }
          }
          break;

        case HarvesterState.MOVING_TO_BASE:
          // Find nearest base
          if (!harvester.targetBaseEntity) {
            harvester.targetBaseEntity = this.findNearestBase(world, position, owner.playerId);
          }

          if (harvester.targetBaseEntity === null) {
            // No base found? Stay idle or stuck
            harvester.state = HarvesterState.IDLE;
            break;
          }

          const basePos = world.getComponent(harvester.targetBaseEntity, Position);
          if (!basePos) {
             harvester.targetBaseEntity = null; // Lost base
             break;
          }

          movable.target = new Vector3(basePos.x, basePos.y, basePos.z);

          const distToBase = new Vector3(position.x, 0, position.z).distanceTo(new Vector3(basePos.x, 0, basePos.z));
          if (distToBase < 2.0) {
            movable.target = null;
            movable.isMoving = false;
            harvester.state = HarvesterState.DEPOSITING;
          }
          break;

        case HarvesterState.DEPOSITING:
          if (harvester.targetBaseEntity === null) {
             harvester.state = HarvesterState.IDLE;
             break;
          }

          harvester.depositTimer += delta;
          if (harvester.depositTimer >= harvester.depositDuration) {
            harvester.depositTimer = 0;

            const stockpile = world.getComponent(harvester.targetBaseEntity, Stockpile);
            if (stockpile) {
              // Transfer all
              inventory.resources.forEach((amount, type) => {
                stockpile.add(type, amount);
              });
              inventory.clear();
            }

            // Go back to resource
            harvester.state = HarvesterState.MOVING_TO_RESOURCE;
          }
          break;
      }
    }
  }

  private findNearestBase(world: World, currentPos: Position, playerId: string): number | null {
    const buildings = world.getEntitiesWith(Building, Position, Owner, Stockpile);
    let nearest = null;
    let minDist = Infinity;

    for (const entity of buildings) {
      const owner = world.getComponent(entity, Owner)!;
      const building = world.getComponent(entity, Building)!;

      if (owner.playerId === playerId && building.type === BuildingType.BASE) {
        const pos = world.getComponent(entity, Position)!;
        const dist = new Vector3(currentPos.x, 0, currentPos.z).distanceTo(new Vector3(pos.x, 0, pos.z));
        if (dist < minDist) {
          minDist = dist;
          nearest = entity;
        }
      }
    }
    return nearest;
  }
}
