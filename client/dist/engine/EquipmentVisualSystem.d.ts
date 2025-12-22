import { System } from '../../../shared/src/ecs/System';
import { World } from '../../../shared/src/ecs/World';
import { Puppet } from '../puppet_system';
export declare class EquipmentVisualSystem extends System {
    private puppetRefs;
    constructor();
    registerPuppet(entityId: string, puppet: Puppet): void;
    update(dt: number, world: World): void;
    private syncEquipment;
    private applyVisual;
    private clearSlot;
    private mapToPuppetSlot;
}
