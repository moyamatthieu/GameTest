import { Component } from '../World';
import { ResourceType } from './ResourceNode';

export class Stockpile implements Component {
  public resources: Map<ResourceType, number> = new Map();

  constructor() {}

  add(type: ResourceType, amount: number) {
    const current = this.resources.get(type) || 0;
    this.resources.set(type, current + amount);
  }

  get(type: ResourceType): number {
    return this.resources.get(type) || 0;
  }
}
