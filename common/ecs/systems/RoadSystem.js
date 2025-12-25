export class RoadSystem {
  constructor(world, game) {
    this.world = world;
    this.game = game;
    this.roadGraph = new Map(); // Map<EntityID, Set<EntityID>>
  }

  update(deltaTime) {
    // Check for new roads and update connections
    // This could be optimized to only run when a road is placed
    const roads = this.world.getEntitiesWith('Road', 'Position');

    // Simple distance-based connection logic for now
    // In a real grid system, we would check adjacent grid cells

    // For visualization, we could draw lines between connected roads
    // But PlanetScene handles rendering based on components.
    // If we want to render connections, we might need a dynamic mesh or update the road meshes.
  }

  // Called when a road is placed
  onRoadPlaced(entityId) {
    const pos = this.world.getComponent(entityId, 'Position');
    const road = this.world.getComponent(entityId, 'Road');

    const otherRoads = this.world.getEntitiesWith('Road', 'Position');

    for (const otherId of otherRoads) {
      if (otherId === entityId) continue;

      const otherPos = this.world.getComponent(otherId, 'Position');

      // Check distance (assuming grid size 10)
      const dist = Math.sqrt(Math.pow(pos.x - otherPos.x, 2) + Math.pow(pos.z - otherPos.z, 2));

      if (dist <= 10.1) { // Slightly more than grid size to account for float errors
        road.connectedTo.push(otherId);
        const otherRoad = this.world.getComponent(otherId, 'Road');
        otherRoad.connectedTo.push(entityId);

        // Update visuals to show connection?
        this.updateRoadVisuals(entityId, otherId);
      }
    }
  }

  updateRoadVisuals(id1, id2) {
    // This would require accessing the scene and modifying meshes
    // For now, we just handle the logic
  }

  // Check if two entities are connected via the road network
  isConnected(entityA, entityB) {
    // Find the closest road to entityA and entityB
    const startRoad = this.findClosestRoad(entityA);
    const endRoad = this.findClosestRoad(entityB);

    if (!startRoad || !endRoad) return false;
    if (startRoad === endRoad) return true;

    // BFS to find path
    const queue = [startRoad];
    const visited = new Set([startRoad]);

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId === endRoad) return true;

      const road = this.world.getComponent(currentId, 'Road');
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

  findClosestRoad(entityId) {
    const pos = this.world.getComponent(entityId, 'Position');
    if (!pos) return null;

    // Check if the entity itself is a road
    if (this.world.getComponent(entityId, 'Road')) return entityId;

    // Find closest road within range (e.g. adjacent)
    const roads = this.world.getEntitiesWith('Road', 'Position');
    let closest = null;
    let minDist = Infinity;

    for (const roadId of roads) {
      const roadPos = this.world.getComponent(roadId, 'Position');
      const dist = Math.sqrt(Math.pow(pos.x - roadPos.x, 2) + Math.pow(pos.z - roadPos.z, 2));

      if (dist < minDist) {
        minDist = dist;
        closest = roadId;
      }
    }

    // Only return if within reasonable distance (e.g. 1.5 * gridSize)
    return minDist <= 15 ? closest : null;
  }
}
