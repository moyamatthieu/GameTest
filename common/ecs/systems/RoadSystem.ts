import { IWorld } from '../../types/ecs';
import { RoadData, PositionData } from '../../types/components';

export class RoadSystem {
  private world: IWorld;
  private game: any;
  private roadGraph: Map<number, Set<number>>;

  constructor(world: IWorld, game: any) {
    this.world = world;
    this.game = game;
    this.roadGraph = new Map();
  }

  update(deltaTime: number): void {
    // Check for new roads and update connections
    // const roads = this.world.getEntitiesWith('Road', 'Position');
  }

  onRoadPlaced(entityId: number): void {
    const pos = this.world.getComponent<PositionData>(entityId, 'Position');
    const road = this.world.getComponent<RoadData>(entityId, 'Road');

    if (!pos || !road) return;

    const otherRoads = this.world.getEntitiesWith('Road', 'Position');

    for (const otherId of otherRoads) {
      if (otherId === entityId) continue;

      const otherPos = this.world.getComponent<PositionData>(otherId, 'Position');
      if (!otherPos) continue;

      const dist = Math.sqrt(Math.pow(pos.x - otherPos.x, 2) + Math.pow(pos.z - otherPos.z, 2));

      if (dist <= 10.1) {
        road.connectedTo.push(otherId);
        const otherRoad = this.world.getComponent<RoadData>(otherId, 'Road');
        if (otherRoad) {
          otherRoad.connectedTo.push(entityId);
        }

        this.updateRoadVisuals(entityId, otherId);
      }
    }
  }

  updateRoadVisuals(id1: number, id2: number): void {
    // Logic for visuals
  }

  isConnected(entityA: number, entityB: number): boolean {
    const startRoad = this.findClosestRoad(entityA);
    const endRoad = this.findClosestRoad(entityB);

    if (startRoad === null || endRoad === null) return false;
    if (startRoad === endRoad) return true;

    const queue = [startRoad];
    const visited = new Set([startRoad]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === endRoad) return true;

      const road = this.world.getComponent<RoadData>(currentId, 'Road');
      if (!road) continue;

      for (const neighborId of road.connectedTo) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return false;
  }

  findClosestRoad(entityId: number): number | null {
    const pos = this.world.getComponent<PositionData>(entityId, 'Position');
    if (!pos) return null;

    if (this.world.getComponent(entityId, 'Road')) return entityId;

    const roads = this.world.getEntitiesWith('Road', 'Position');
    let closest: number | null = null;
    let minDist = Infinity;

    for (const roadId of roads) {
      const roadPos = this.world.getComponent<PositionData>(roadId, 'Position');
      if (!roadPos) continue;

      const dist = Math.sqrt(Math.pow(pos.x - roadPos.x, 2) + Math.pow(pos.z - roadPos.z, 2));

      if (dist < minDist) {
        minDist = dist;
        closest = roadId;
      }
    }

    return minDist <= 15 ? closest : null;
  }
}
