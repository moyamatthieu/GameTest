import { Component } from '../ecs/Component';
export declare class Stats implements Component {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    stamina: number;
    maxStamina: number;
    level: number;
    moveSpeed: number;
    attackPower: number;
    defense: number;
    static readonly TYPE = "Stats";
    readonly _type = "Stats";
    constructor(hp?: number, maxHp?: number, mana?: number, maxMana?: number, stamina?: number, maxStamina?: number, level?: number, moveSpeed?: number, attackPower?: number, defense?: number);
}
