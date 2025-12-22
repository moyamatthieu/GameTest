import { Component } from '../ecs/Component';

export class Identity implements Component {
  public static readonly TYPE = 'Identity';
  public readonly _type = Identity.TYPE;

  constructor(
    public firstName: string = 'Inconnu',
    public lastName: string = 'Anonyme'
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
