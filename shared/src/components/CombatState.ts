import { Component } from '../ecs/Component';

export interface CastingInfo {
  abilityId: string;
  remainingTime: number;
  totalTime: number;
  targetId: string | null;
}

export class CombatState implements Component {
  public static readonly TYPE = 'CombatState';
  public readonly _type = CombatState.TYPE;

  public targetId: string | null = null;
  public cooldowns: Map<string, number> = new Map();
  public casting: CastingInfo | null = null;
  public isBlocking: boolean = false;
  public lastAttackTime: number = 0;

  constructor() {}
}
