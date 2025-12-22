import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { EquipmentSlot } from '../types/Items';
export declare class EquipmentSystem extends System {
    constructor();
    update(dt: number, world: World): void;
    equipItem(entityId: string, itemId: string, world: World): string | null;
    unequipItem(entityId: string, slot: EquipmentSlot, world: World): string | null;
    refreshStats(entityId: string, world: World): void;
}
