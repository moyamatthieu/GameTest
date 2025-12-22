import { Component } from '../ecs/Component';

export class Position implements Component {
  public static readonly TYPE = 'Position';
  public readonly _type = Position.TYPE;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public rotationY: number = 0,
    public pitch: number = 0
  ) {}
}
