import { Component } from '../ecs/Component';

export enum RenderType {
  BOX,
  SPHERE,
  PLAYER
}

export class Renderable implements Component {
  public static readonly TYPE = 'Renderable';
  public readonly _type = Renderable.TYPE;

  constructor(
    public type: RenderType = RenderType.BOX,
    public color: number = 0xffffff
  ) {}
}
