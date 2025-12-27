import { Component } from '../World';

export enum BuildingType {
  BASE = 'Base',
  FACTORY = 'Factory',
  FARM = 'Farm',
  HABITATION = 'Habitation'
}

export class Building implements Component {
  constructor(public type: BuildingType) {}
}
