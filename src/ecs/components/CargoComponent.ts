import { Component } from '../World';
import { ResourceType, ResourceStack } from '../../core/economy/types';

export class CargoComponent implements Component {
  public items: Map<ResourceType, number> = new Map();

  constructor(public capacity: number = 100) {}

  get currentLoad(): number {
    let total = 0;
    this.items.forEach(amount => total += amount);
    return total;
  }

  add(type: ResourceType, amount: number): number {
    const spaceLeft = this.capacity - this.currentLoad;
    const actualAmount = Math.min(amount, spaceLeft);

    if (actualAmount > 0) {
      const current = this.items.get(type) || 0;
      this.items.set(type, current + actualAmount);
    }

    return actualAmount;
  }

  hasSpace(): boolean {
    return this.currentLoad < this.capacity;
  }
}
