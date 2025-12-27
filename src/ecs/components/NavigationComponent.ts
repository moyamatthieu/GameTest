import * as THREE from 'three';

export enum NavigationState {
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  ARRIVED = 'ARRIVED'
}

export class NavigationComponent {
  public targetPosition: THREE.Vector3 | null = null;
  public state: NavigationState = NavigationState.IDLE;
  public stoppingDistance: number = 1.0;

  constructor() {}

  public setTarget(position: THREE.Vector3) {
    this.targetPosition = position.clone();
    this.state = NavigationState.MOVING;
  }

  public clearTarget() {
    this.targetPosition = null;
    this.state = NavigationState.IDLE;
  }
}
