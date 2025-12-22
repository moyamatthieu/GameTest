import { Component } from '../ecs/Component';

export enum NPCType {
  MERCHANT = 'Merchant',
  QUEST_GIVER = 'QuestGiver',
  ENEMY = 'Enemy'
}

export class NPC implements Component {
  public static readonly TYPE = 'NPC';
  public readonly _type = NPC.TYPE;

  constructor(
    public name: string,
    public npcType: NPCType,
    public dialogue: string[] = []
  ) {}
}
