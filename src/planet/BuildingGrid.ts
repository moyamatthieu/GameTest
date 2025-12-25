import * as THREE from 'three';

export interface IPlanetGenerator {
  radius: number;
  cartesianToSpherical(x: number, y: number, z: number): { theta: number; phi: number };
  sphericalToCartesian(radius: number, theta: number, phi: number): { x: number; y: number; z: number };
  getTerrainHeight(x: number, y: number, z: number): number;
  getTerrainDataAt(position: THREE.Vector3): any;
}

export class BuildingGrid {
  private planetGenerator: IPlanetGenerator;
  private cellSize: number;
  private maxSlope: number;
  private occupiedCells: Map<string, number>;
  private gridMesh: THREE.Points | null = null;
  private gridVisible = false;

  constructor(planetGenerator: IPlanetGenerator, options: any = {}) {
    this.planetGenerator = planetGenerator;
    this.cellSize = options.cellSize || 5;
    this.maxSlope = options.maxSlope || 25;
    this.occupiedCells = new Map();
  }

  worldToGrid(position: THREE.Vector3): { theta: number; phi: number } {
    const normalized = position.clone().normalize();
    const spherical = this.planetGenerator.cartesianToSpherical(normalized.x, normalized.y, normalized.z);
    return {
      theta: this.roundToGrid(spherical.theta),
      phi: this.roundToGrid(spherical.phi)
    };
  }

  gridToWorld(theta: number, phi: number): THREE.Vector3 {
    const basePos = this.planetGenerator.sphericalToCartesian(1, theta, phi);
    const height = this.planetGenerator.getTerrainHeight(basePos.x, basePos.y, basePos.z);
    const radius = this.planetGenerator.radius + height;
    const worldPos = this.planetGenerator.sphericalToCartesian(radius, theta, phi);
    return new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
  }

  private roundToGrid(angle: number): number {
    const arcLength = angle * this.planetGenerator.radius;
    const snapped = Math.round(arcLength / this.cellSize) * this.cellSize;
    return snapped / this.planetGenerator.radius;
  }

  private getCellKey(theta: number, phi: number): string {
    const t = Math.round(theta * 1000000) / 1000000;
    const p = Math.round(phi * 1000000) / 1000000;
    return `${t},${p}`;
  }

  isCellOccupied(theta: number, phi: number): boolean {
    return this.occupiedCells.has(this.getCellKey(theta, phi));
  }

  occupyCell(theta: number, phi: number, entityId: number): void {
    this.occupiedCells.set(this.getCellKey(theta, phi), entityId);
  }

  freeCell(theta: number, phi: number): void {
    this.occupiedCells.delete(this.getCellKey(theta, phi));
  }

  getCellOccupant(theta: number, phi: number): number | undefined {
    return this.occupiedCells.get(this.getCellKey(theta, phi));
  }

  getNeighborCells(theta: number, phi: number): { theta: number; phi: number }[] {
    const neighbors: { theta: number; phi: number }[] = [];
    const delta = this.cellSize / this.planetGenerator.radius;

    for (let dTheta = -1; dTheta <= 1; dTheta++) {
      for (let dPhi = -1; dPhi <= 1; dPhi++) {
        if (dTheta === 0 && dPhi === 0) continue;
        const neighborTheta = theta + dTheta * delta;
        const neighborPhi = phi + dPhi * delta;
        if (neighborPhi >= 0 && neighborPhi <= Math.PI) {
          neighbors.push({ theta: neighborTheta, phi: neighborPhi });
        }
      }
    }
    return neighbors;
  }

  canPlaceBuilding(theta: number, phi: number, buildingSize = 1): boolean {
    if (this.isCellOccupied(theta, phi)) return false;
    if (buildingSize > 1) {
      const neighbors = this.getNeighborCells(theta, phi);
      for (const neighbor of neighbors) {
        if (this.isCellOccupied(neighbor.theta, neighbor.phi)) return false;
      }
    }
    return true;
  }

  createVisualGrid(scene: THREE.Scene): void {
    if (this.gridMesh) {
      scene.remove(this.gridMesh);
      this.gridMesh.geometry.dispose();
      (this.gridMesh.material as THREE.Material).dispose();
    }

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    const thetaSteps = Math.ceil((2 * Math.PI * this.planetGenerator.radius) / this.cellSize);
    const phiSteps = Math.ceil((Math.PI * this.planetGenerator.radius) / this.cellSize);

    for (let i = 0; i <= thetaSteps; i++) {
      const theta = (i / thetaSteps) * 2 * Math.PI - Math.PI;
      for (let j = 0; j <= phiSteps; j++) {
        const phi = (j / phiSteps) * Math.PI;
        const pos = this.gridToWorld(theta, phi);
        const isOccupied = this.isCellOccupied(theta, phi);
        const color = isOccupied ? new THREE.Color(0xff0000) : new THREE.Color(0x00ff00);
        positions.push(pos.x, pos.y, pos.z);
        colors.push(color.r, color.g, color.b);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 1, vertexColors: true, transparent: true, opacity: 0.5 });
    this.gridMesh = new THREE.Points(geometry, material);
    scene.add(this.gridMesh);
    this.gridVisible = true;
  }

  toggleGridVisibility(): void {
    if (this.gridMesh) {
      this.gridMesh.visible = !this.gridMesh.visible;
      this.gridVisible = this.gridMesh.visible;
    }
  }

  dispose(): void {
    if (this.gridMesh) {
      this.gridMesh.geometry.dispose();
      (this.gridMesh.material as THREE.Material).dispose();
    }
  }
}
