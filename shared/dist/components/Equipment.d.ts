import { Component } from '../ecs/Component';
import { EquipmentSlot, ItemId } from '../types/Items';
export declare class Equipment implements Component {
    static readonly TYPE = "Equipment";
    readonly _type = "Equipment";
    slots: Record<EquipmentSlot, ItemId | null>;
    constructor();
}
