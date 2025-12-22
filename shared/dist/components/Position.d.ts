import { Component } from '../ecs/Component';
export declare class Position implements Component {
    x: number;
    y: number;
    z: number;
    rotationY: number;
    pitch: number;
    static readonly TYPE = "Position";
    readonly _type = "Position";
    constructor(x?: number, y?: number, z?: number, rotationY?: number, pitch?: number);
}
