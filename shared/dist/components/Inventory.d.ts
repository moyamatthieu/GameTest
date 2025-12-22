import { Component } from '../ecs/Component';
import { InventoryItem } from '../types/Items';
export declare class Inventory implements Component {
    static readonly TYPE = "Inventory";
    readonly _type = "Inventory";
    items: InventoryItem[];
    maxSize: number;
    constructor(maxSize?: number);
}
