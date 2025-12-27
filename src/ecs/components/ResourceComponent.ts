import { Component } from '../World';
import { ResourceType } from '../../core/economy/types';

export class ResourceComponent implements Component {
  constructor(
    public type: ResourceType,
    public abundance: number, // Total amount available
    public extractionRate: number = 1 // Amount per second
  ) {}
}
