import { World } from '../../../shared/src/ecs/World';

export enum NodeStatus {
  SUCCESS,
  FAILURE,
  RUNNING,
}

export class Blackboard {
  private data: Map<string, any> = new Map();

  public set(key: string, value: any): void {
    this.data.set(key, value);
  }

  public get<T>(key: string): T | undefined {
    return this.data.get(key);
  }

  public has(key: string): boolean {
    return this.data.has(key);
  }

  public delete(key: string): void {
    this.data.delete(key);
  }
}

export interface Context {
  world: World;
  entityId: string;
  blackboard: Blackboard;
  dt: number;
}

export abstract class Node {
  public abstract tick(context: Context): NodeStatus;
}

// --- Composites ---

export class Selector extends Node {
  constructor(private children: Node[]) {
    super();
  }

  public tick(context: Context): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status !== NodeStatus.FAILURE) {
        return status;
      }
    }
    return NodeStatus.FAILURE;
  }
}

export class Sequence extends Node {
  constructor(private children: Node[]) {
    super();
  }

  public tick(context: Context): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status !== NodeStatus.SUCCESS) {
        return status;
      }
    }
    return NodeStatus.SUCCESS;
  }
}

// --- Decorators ---

export class Inverter extends Node {
  constructor(private child: Node) {
    super();
  }

  public tick(context: Context): NodeStatus {
    const status = this.child.tick(context);
    if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
    if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
    return status;
  }
}

// --- Leaves ---

export class ActionNode extends Node {
  constructor(private action: (context: Context) => NodeStatus) {
    super();
  }

  public tick(context: Context): NodeStatus {
    return this.action(context);
  }
}

export class ConditionNode extends Node {
  constructor(private condition: (context: Context) => boolean) {
    super();
  }

  public tick(context: Context): NodeStatus {
    return this.condition(context) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}
