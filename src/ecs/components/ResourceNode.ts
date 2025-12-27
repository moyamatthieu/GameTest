import { Component } from '../World';

export enum ResourceType {
  IRON = 'Iron',
  WATER = 'Water',
  FOOD = 'Food'
}

export class ResourceNode implements Component {
  constructor(
    public type: ResourceType,
    public amount: number = 1000,
    public maxAmount: number = 1000
  ) {}
}
