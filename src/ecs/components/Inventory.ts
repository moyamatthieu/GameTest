import { Component } from '../World';
import { ResourceType } from './ResourceNode';

export class Inventory implements Component {
  public resources: Map<ResourceType, number> = new Map();

  constructor(public capacity: number = 10) {}

  add(type: ResourceType, amount: number): number {
    const current = this.resources.get(type) || 0;
    const space = this.capacity - this.currentLoad();
    const toAdd = Math.min(amount, space);

    this.resources.set(type, current + toAdd);
    return toAdd;
  }

  currentLoad(): number {
    let total = 0;
    for (const amount of this.resources.values()) {
      total += amount;
    }
    return total;
  }

  clear() {
    this.resources.clear();
  }
}
