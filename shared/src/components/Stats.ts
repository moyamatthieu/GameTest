import { Component } from '../ecs/Component';

export class Stats implements Component {
  public static readonly TYPE = 'Stats';
  public readonly _type = Stats.TYPE;

  constructor(
    public hp: number = 100,
    public maxHp: number = 100,
    public mana: number = 100,
    public maxMana: number = 100,
    public stamina: number = 100,
    public maxStamina: number = 100,
    public level: number = 1,
    public moveSpeed: number = 5,
    public attackPower: number = 5,
    public defense: number = 0,
    // Statistiques Arthuriennes
    public strength: number = 10,
    public dexterity: number = 10,
    public wisdom: number = 10,
    public faith: number = 10,
    public luck: number = 10
  ) {}
}
