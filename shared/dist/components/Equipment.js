import { EquipmentSlot } from '../types/Items';
export class Equipment {
    static TYPE = 'Equipment';
    _type = Equipment.TYPE;
    slots = {
        [EquipmentSlot.MAIN_HAND]: null,
        [EquipmentSlot.OFF_HAND]: null
    };
    constructor() { }
}
//# sourceMappingURL=Equipment.js.map