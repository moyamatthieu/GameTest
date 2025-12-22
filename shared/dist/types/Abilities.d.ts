export declare enum AbilityType {
    MELEE = "MELEE",
    SPELL = "SPELL",
    HEAL = "HEAL",
    BLOCK = "BLOCK"
}
export interface Ability {
    id: string;
    name: string;
    type: AbilityType;
    castTime: number;
    cooldown: number;
    manaCost: number;
    staminaCost: number;
    range: number;
    power: number;
}
export declare const ABILITIES: Record<string, Ability>;
