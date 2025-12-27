import { Component } from '../World';
import { Entity } from '../World';

export enum HarvesterState {
  IDLE = 'IDLE',
  MOVING_TO_RESOURCE = 'MOVING_TO_RESOURCE',
  HARVESTING = 'HARVESTING',
  MOVING_TO_BASE = 'MOVING_TO_BASE',
  DEPOSITING = 'DEPOSITING'
}

export class Harvester implements Component {
  public state: HarvesterState = HarvesterState.IDLE;
  public targetResourceEntity: Entity | null = null;
  public targetBaseEntity: Entity | null = null;
  public harvestTimer: number = 0;
  public harvestDuration: number = 2.5; // 2.5 seconds to harvest
  public depositTimer: number = 0;
  public depositDuration: number = 1.0; // 1 second to deposit

  constructor(public harvestRate: number = 10) {}
}
