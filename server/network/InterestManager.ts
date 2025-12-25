interface Position {
  x: number;
  y: number;
  z: number;
}

interface EntityPosition extends Position {
  data: any;
}

interface InterestMetrics {
  totalEntities: number;
  entitiesSent: number;
  reductionRatio: number;
  updates: number;
}

/**
 * Interest Manager - Gestion de l'Area of Interest (AOI)
 * Utilise le spatial hashing pour optimiser les envois de données aux joueurs
 */
export class InterestManager {
  private cellSize: number;
  private grid: Map<string, Set<number>>;
  private playerPositions: Map<string, Position>;
  private entityPositions: Map<number, EntityPosition>;
  private playerInterests: Map<string, Set<number>>;
  private metrics: InterestMetrics;

  constructor(cellSize = 1000) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.playerPositions = new Map();
    this.entityPositions = new Map();
    this.playerInterests = new Map();

    this.metrics = {
      totalEntities: 0,
      entitiesSent: 0,
      reductionRatio: 0,
      updates: 0
    };
  }

  getCellKey(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  getNeighborCells(cellKey: string): string[] {
    const [cx, cy, cz] = cellKey.split(',').map(Number);
    const neighbors: string[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          neighbors.push(`${cx + x},${cy + y},${cz + z}`);
        }
      }
    }

    return neighbors;
  }

  updatePlayerPosition(playerId: string, position: Position): void {
    const oldPosition = this.playerPositions.get(playerId);
    this.playerPositions.set(playerId, position);

    if (!oldPosition ||
        oldPosition.x !== position.x ||
        oldPosition.y !== position.y ||
        oldPosition.z !== position.z) {
      this.updatePlayerInterest(playerId);
    }
  }

  updateEntity(entityId: number, position: Position, data: any): void {
    const oldPosition = this.entityPositions.get(entityId);

    if (oldPosition) {
      const oldCellKey = this.getCellKey(oldPosition.x, oldPosition.y, oldPosition.z);
      const oldCell = this.grid.get(oldCellKey);
      if (oldCell) {
        oldCell.delete(entityId);
        if (oldCell.size === 0) {
          this.grid.delete(oldCellKey);
        }
      }
    }

    this.entityPositions.set(entityId, { ...position, data });
    const cellKey = this.getCellKey(position.x, position.y, position.z);

    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set());
    }
    this.grid.get(cellKey)!.add(entityId);

    this.updateInterestsForEntity(entityId, position);
  }

  removeEntity(entityId: number): void {
    const position = this.entityPositions.get(entityId);
    if (!position) return;

    const cellKey = this.getCellKey(position.x, position.y, position.z);
    const cell = this.grid.get(cellKey);
    if (cell) {
      cell.delete(entityId);
      if (cell.size === 0) {
        this.grid.delete(cellKey);
      }
    }

    this.entityPositions.delete(entityId);

    for (const interests of this.playerInterests.values()) {
      interests.delete(entityId);
    }
  }

  updatePlayerInterest(playerId: string): void {
    const position = this.playerPositions.get(playerId);
    if (!position) return;

    const cellKey = this.getCellKey(position.x, position.y, position.z);
    const neighborCells = this.getNeighborCells(cellKey);
    const interests = new Set<number>();

    for (const cell of neighborCells) {
      const entities = this.grid.get(cell);
      if (entities) {
        for (const entityId of entities) {
          interests.add(entityId);
        }
      }
    }

    this.playerInterests.set(playerId, interests);
  }

  updateInterestsForEntity(entityId: number, position: Position): void {
    const cellKey = this.getCellKey(position.x, position.y, position.z);
    const neighborCells = this.getNeighborCells(cellKey);

    for (const [playerId, playerPosition] of this.playerPositions) {
      const playerCellKey = this.getCellKey(
        playerPosition.x,
        playerPosition.y,
        playerPosition.z
      );

      if (neighborCells.includes(playerCellKey)) {
        const interests = this.playerInterests.get(playerId) || new Set<number>();
        interests.add(entityId);
        this.playerInterests.set(playerId, interests);
      } else {
        const interests = this.playerInterests.get(playerId);
        if (interests) {
          interests.delete(entityId);
        }
      }
    }
  }

  getInterestsForPlayer(playerId: string): any[] {
    const interests = this.playerInterests.get(playerId);
    if (!interests) return [];

    const entities: any[] = [];
    for (const entityId of interests) {
      const entityData = this.entityPositions.get(entityId);
      if (entityData) {
        entities.push({
          id: entityId,
          ...entityData
        });
      }
    }

    return entities;
  }

  filterEntitiesForPlayer(playerId: string, allEntities: any[]): any[] {
    this.metrics.totalEntities = allEntities.length;

    const interests = this.getInterestsForPlayer(playerId);
    const interestIds = new Set(interests.map(e => e.id));

    const filtered = allEntities.filter(entity => interestIds.has(entity.id));

    this.metrics.entitiesSent += filtered.length;
    this.metrics.updates++;
    this.metrics.reductionRatio =
      (1 - filtered.length / Math.max(1, allEntities.length)) * 100;

    return filtered;
  }

  getMetrics() {
    return {
      ...this.metrics,
      reductionRatio: this.metrics.reductionRatio.toFixed(2) + '%',
      averageEntitiesPerUpdate: this.metrics.updates > 0 ?
        (this.metrics.entitiesSent / this.metrics.updates).toFixed(2) : 0,
      activePlayers: this.playerPositions.size,
      trackedEntities: this.entityPositions.size
    };
  }

  removePlayer(playerId: string): void {
    this.playerPositions.delete(playerId);
    this.playerInterests.delete(playerId);
  }

  clear(): void {
    this.grid.clear();
    this.playerPositions.clear();
    this.entityPositions.clear();
    this.playerInterests.clear();
    this.metrics = {
      totalEntities: 0,
      entitiesSent: 0,
      reductionRatio: 0,
      updates: 0
    };
  }
}
