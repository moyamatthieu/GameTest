import { Component } from '../ecs/Component';

export class Velocity implements Component {
  public static readonly TYPE = 'Velocity';
  public readonly _type = Velocity.TYPE;

  constructor(
    public vx: number = 0,
    public vy: number = 0,
    public vz: number = 0
  ) {}
}
