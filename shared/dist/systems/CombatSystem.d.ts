import { System } from '../ecs/System';
import { World } from '../ecs/World';
export interface CombatEvent {
    type: 'damage' | 'heal' | 'death';
    sourceId: string;
    targetId: string;
    abilityId: string;
    value: number;
}
export type CombatCallback = (event: CombatEvent) => void;
export declare class CombatSystem extends System {
    private onCombatEvent;
    constructor(onCombatEvent?: CombatCallback | null);
    update(dt: number, world: World): void;
    useAbility(entityId: string, abilityId: string, targetId: string | null, world: World): boolean;
    private executeAbility;
}
