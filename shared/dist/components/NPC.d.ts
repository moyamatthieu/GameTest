import { Component } from '../ecs/Component';
export declare enum NPCType {
    MERCHANT = "Merchant",
    QUEST_GIVER = "QuestGiver",
    ENEMY = "Enemy"
}
export declare class NPC implements Component {
    name: string;
    npcType: NPCType;
    dialogue: string[];
    static readonly TYPE = "NPC";
    readonly _type = "NPC";
    constructor(name: string, npcType: NPCType, dialogue?: string[]);
}
