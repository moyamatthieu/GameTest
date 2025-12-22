import { Component } from '../ecs/Component';
export declare enum RenderType {
    BOX = 0,
    SPHERE = 1,
    PLAYER = 2
}
export declare class Renderable implements Component {
    type: RenderType;
    color: number;
    static readonly TYPE = "Renderable";
    readonly _type = "Renderable";
    constructor(type?: RenderType, color?: number);
}
