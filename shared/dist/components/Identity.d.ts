import { Component } from '../ecs/Component';
export declare class Identity implements Component {
    firstName: string;
    lastName: string;
    static readonly TYPE = "Identity";
    readonly _type = "Identity";
    constructor(firstName?: string, lastName?: string);
    get fullName(): string;
}
