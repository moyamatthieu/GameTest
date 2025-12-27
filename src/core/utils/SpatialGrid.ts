import * as THREE from 'three';

export class SpatialGrid {
  private grid: Map<string, string[]> = new Map(); // cellKey -> entityIds
  private entityPositions: Map<string, THREE.Vector3> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 10) {
    this.cellSize = cellSize;
  }

  private getCellKey(position: THREE.Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${z}`;
  }

  insert(entityId: string, position: THREE.Vector3): void {
    this.entityPositions.set(entityId, position.clone());
    const key = this.getCellKey(position);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(entityId);
  }

  remove(entityId: string): void {
    if (this.entityPositions.has(entityId)) {
      const position = this.entityPositions.get(entityId)!;
      const key = this.getCellKey(position);
      const cell = this.grid.get(key);
      if (cell) {
        const index = cell.indexOf(entityId);
        if (index > -1) {
          cell.splice(index, 1);
        }
        if (cell.length === 0) {
          this.grid.delete(key);
        }
      }
      this.entityPositions.delete(entityId);
    }
  }

  update(entityId: string, newPosition: THREE.Vector3): void {
    this.remove(entityId);
    this.insert(entityId, newPosition);
  }

  queryCircle(center: THREE.Vector3, radius: number): string[] {
    const results: string[] = [];
    const minX = Math.floor((center.x - radius) / this.cellSize);
    const maxX = Math.floor((center.x + radius) / this.cellSize);
    const minZ = Math.floor((center.z - radius) / this.cellSize);
    const maxZ = Math.floor((center.z + radius) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        const key = `${x},${z}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const entityId of cell) {
            const pos = this.entityPositions.get(entityId);
            if (pos && pos.distanceTo(center) <= radius) {
              results.push(entityId);
            }
          }
        }
      }
    }
    return results;
  }

  queryRect(min: THREE.Vector3, max: THREE.Vector3): string[] {
    const results: string[] = [];
    const minX = Math.floor(min.x / this.cellSize);
    const maxX = Math.floor(max.x / this.cellSize);
    const minZ = Math.floor(min.z / this.cellSize);
    const maxZ = Math.floor(max.z / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        const key = `${x},${z}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const entityId of cell) {
            const pos = this.entityPositions.get(entityId);
            if (pos && pos.x >= min.x && pos.x <= max.x && pos.z >= min.z && pos.z <= max.z) {
              results.push(entityId);
            }
          }
        }
      }
    }
    return results;
  }

  getAllEntities(): string[] {
    return Array.from(this.entityPositions.keys());
  }
}
