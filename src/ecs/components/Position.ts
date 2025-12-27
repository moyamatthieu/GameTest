import { Component } from '../World';

export class Position implements Component {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
}
