import { Entity } from './Entity';
import { Component, ComponentConstructor } from './Component';
import { System } from './System';

export class World {
  private entities: Set<Entity> = new Set();
  private components: Map<string, Map<Entity, Component>> = new Map();
  private systems: System[] = [];
  private nextEntityId: number = 0;

  public createEntity(): Entity {
    const entity = (this.nextEntityId++).toString();
    this.entities.add(entity);
    return entity;
  }

  public destroyEntity(entity: Entity): void {
    this.entities.delete(entity);
    for (const componentMap of this.components.values()) {
      componentMap.delete(entity);
    }
  }

  public addComponent<T extends Component>(entity: Entity, component: T): void {
    const type = component._type;
    if (!this.components.has(type)) {
      this.components.set(type, new Map());
    }
    this.components.get(type)!.set(entity, component);
  }

  public getComponent<T extends Component>(entity: Entity, constructor: ComponentConstructor<T>): T | undefined {
    const type = (constructor as any).TYPE;
    const componentMap = this.components.get(type);
    return componentMap ? (componentMap.get(entity) as T) : undefined;
  }

  public removeComponent<T extends Component>(entity: Entity, constructor: ComponentConstructor<T>): void {
    const type = (constructor as any).TYPE;
    this.components.get(type)?.delete(entity);
  }

  public hasComponent<T extends Component>(entity: Entity, constructor: ComponentConstructor<T>): boolean {
    const type = (constructor as any).TYPE;
    return this.components.get(type)?.has(entity) ?? false;
  }

  public addSystem(system: System): void {
    this.systems.push(system);
  }

  public update(dt: number): void {
    for (const system of this.systems) {
      system.update(dt, this);
    }
  }

  public getEntitiesWith(...constructors: ComponentConstructor<any>[]): Entity[] {
    if (constructors.length === 0) return Array.from(this.entities);

    const types = constructors.map(c => (c as any).TYPE);
    const firstType = types[0];
    const firstMap = this.components.get(firstType);
    
    if (!firstMap) return [];

    const result: Entity[] = [];
    for (const entity of firstMap.keys()) {
      let hasAll = true;
      for (let i = 1; i < types.length; i++) {
        if (!this.components.get(types[i])?.has(entity)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        result.push(entity);
      }
    }
    return result;
  }
}
