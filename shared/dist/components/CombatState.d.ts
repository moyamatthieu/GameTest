import { Component } from '../ecs/Component';
export interface CastingInfo {
    abilityId: string;
    remainingTime: number;
    totalTime: number;
    targetId: string | null;
}
export declare class CombatState implements Component {
    static readonly TYPE = "CombatState";
    readonly _type = "CombatState";
    targetId: string | null;
    cooldowns: Map<string, number>;
    casting: CastingInfo | null;
    isBlocking: boolean;
    lastAttackTime: number;
    constructor();
}
