import { Component } from '../World';

export class SelectionComponent implements Component {
  constructor(
    public isSelected: boolean = false,
    public selectionGroup: string = 'default'
  ) {}
}
