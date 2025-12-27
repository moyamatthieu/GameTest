import { World, Entity } from '../World';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { ResourceComponent } from '../components/ResourceComponent';
import { CargoComponent } from '../components/CargoComponent';
import { MovementController } from '../../ui/input/MovementController';

export class MiningSystem {
  private miningRange: number = 50;
  private extractionTimer: number = 0;

  constructor(
    private world: World,
    private controller: MovementController
  ) {}

  update(playerEntity: Entity, deltaTime: number) {
    const isMining = this.controller.isKeyPressed('KeyG');
    if (!isMining) {
      this.extractionTimer = 0;
      return;
    }

    const playerPhysics = this.world.getComponent(playerEntity, PhysicsComponent);
    const playerCargo = this.world.getComponent(playerEntity, CargoComponent);
    if (!playerPhysics || !playerCargo) return;

    // Find nearest planet with resources
    const planets = this.world.getEntitiesWith(ResourceComponent, PhysicsComponent);
    let nearestPlanet: Entity | null = null;
    let minDist = Infinity;

    planets.forEach(planet => {
      const planetPhysics = this.world.getComponent(planet, PhysicsComponent)!;
      const dist = playerPhysics.position.distanceTo(planetPhysics.position);
      if (dist < minDist) {
        minDist = dist;
        nearestPlanet = planet;
      }
    });

    if (nearestPlanet && minDist < this.miningRange) {
      const resource = this.world.getComponent(nearestPlanet, ResourceComponent)!;

      this.extractionTimer += deltaTime;
      if (this.extractionTimer >= 1.0) { // Extract every second
        const amount = Math.min(resource.extractionRate, resource.abundance);
        if (amount > 0) {
          const added = playerCargo.add(resource.type, amount);
          resource.abundance -= added;
          console.log(`Extracted ${added} ${resource.type}. Cargo: ${playerCargo.currentLoad}/${playerCargo.capacity}`);
        }
        this.extractionTimer = 0;
      }
    }
  }
}
