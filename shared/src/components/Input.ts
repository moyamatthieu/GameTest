import { Component } from '../ecs/Component';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  block: boolean;
  yaw: number;
  pitch: number;
}

export class Input implements Component {
  public static readonly TYPE = 'Input';
  public readonly _type = Input.TYPE;

  public sequence: number = 0;
  public state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    attack: false,
    block: false,
    yaw: 0,
    pitch: 0
  };

  constructor() {}
}
