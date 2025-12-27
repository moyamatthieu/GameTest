import { Component } from '../World';
import { Vector3 } from 'three';

export class Movable implements Component {
  public target: Vector3 | null = null;
  public isMoving: boolean = false;

  constructor(public speed: number = 0.1) {}
}
