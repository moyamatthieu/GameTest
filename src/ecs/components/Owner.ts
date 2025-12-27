import { Component } from '../World';

export class Owner implements Component {
  constructor(public playerId: string) {}
}
