import { Component } from '../../../shared/src/ecs/Component';
import { Node, Blackboard } from './BehaviorTree';

export class AIComponent implements Component {
  public static readonly TYPE = 'AIComponent';
  public readonly _type = AIComponent.TYPE;

  public blackboard: Blackboard;
  public rootNode: Node;
  public lastUpdate: number = 0;
  public updateInterval: number = 100; // ms

  constructor(rootNode: Node) {
    this.rootNode = rootNode;
    this.blackboard = new Blackboard();
  }
}
