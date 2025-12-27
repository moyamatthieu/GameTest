import { Component } from '../World';

export class Selectable implements Component {
  constructor(public selected: boolean = false) {}
}
