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
export declare class Input implements Component {
    static readonly TYPE = "Input";
    readonly _type = "Input";
    sequence: number;
    state: InputState;
    constructor();
}
