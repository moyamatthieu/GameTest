import { Component } from '../World';
import { ViewScale } from '../../core/world/types';

export class LocationComponent implements Component {
  constructor(
    public clusterX: number = 0,
    public clusterY: number = 0,
    public systemId: string = '',
    public viewScale: ViewScale = 'Galaxy',
    public localPos: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ) {}

  set(clusterX: number, clusterY: number, systemId: string, viewScale: ViewScale, localPos: { x: number; y: number; z: number }) {
    this.clusterX = clusterX;
    this.clusterY = clusterY;
    this.systemId = systemId;
    this.viewScale = viewScale;
    this.localPos = { ...localPos };
  }

  equals(other: LocationComponent): boolean {
    return (
      this.clusterX === other.clusterX &&
      this.clusterY === other.clusterY &&
      this.systemId === other.systemId &&
      this.viewScale === other.viewScale &&
      this.localPos.x === other.localPos.x &&
      this.localPos.y === other.localPos.y &&
      this.localPos.z === other.localPos.z
    );
  }
}
