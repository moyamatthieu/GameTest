import { Component } from '../ecs/Component';
import { InventoryItem } from '../types/Items';

export class Inventory implements Component {
    public static readonly TYPE = 'Inventory';
    public readonly _type = Inventory.TYPE;

    public items: InventoryItem[] = [];
    public maxSize: number = 20;

    constructor(maxSize: number = 20) {
        this.maxSize = maxSize;
    }
}
