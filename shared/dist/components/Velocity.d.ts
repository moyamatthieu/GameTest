import { Component } from '../ecs/Component';
export declare class Velocity implements Component {
    vx: number;
    vy: number;
    vz: number;
    static readonly TYPE = "Velocity";
    readonly _type = "Velocity";
    constructor(vx?: number, vy?: number, vz?: number);
}
