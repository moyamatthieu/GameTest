import { Component } from '../ecs/Component';
import { EquipmentSlot, ItemId } from '../types/Items';

export class Equipment implements Component {
    public static readonly TYPE = 'Equipment';
    public readonly _type = Equipment.TYPE;

    public slots: Record<EquipmentSlot, ItemId | null> = {
        [EquipmentSlot.HEAD]: null,
        [EquipmentSlot.TORSO]: null,
        [EquipmentSlot.ARMS]: null,
        [EquipmentSlot.LEGS]: null,
        [EquipmentSlot.BACK]: null,
        [EquipmentSlot.MAIN_HAND]: null,
        [EquipmentSlot.OFF_HAND]: null
    };

    constructor() {}
}
