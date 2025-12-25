import { ComponentTypes, ComponentName } from './components';
import { Entity, IWorld, System } from '../types/ecs';

export class World implements IWorld {
  private entities: Set<Entity>;
  private components: Map<string, Map<Entity, any>>;
  private entityMasks: Map<Entity, number>;
  private systems: System[];
  private queries: Map<number, Set<Entity>>;
  private nextEntityId: number;

  public onEntityAdded: ((entity: Entity) => void) | null = null;
  public onEntityRemoved: ((entity: Entity) => void) | null = null;

  constructor() {
    this.entities = new Set();
    this.components = new Map();
    this.entityMasks = new Map();
    this.systems = [];
    this.queries = new Map();
    this.nextEntityId = 0;
  }

  createEntity(requestedId: number | null = null): Entity {
    let entity: Entity;
    if (requestedId !== null) {
      entity = requestedId;
      if (entity >= this.nextEntityId) {
        this.nextEntityId = entity + 1;
      }
    } else {
      entity = this.nextEntityId++;
    }
    this.entities.add(entity);
    this.entityMasks.set(entity, 0);

    if (this.onEntityAdded) {
      this.onEntityAdded(entity);
    }

    return entity;
  }

  destroyEntity(entity: Entity): void {
    if (this.onEntityRemoved) {
      this.onEntityRemoved(entity);
    }

    this.entities.delete(entity);
    this.entityMasks.delete(entity);
    for (const componentMap of this.components.values()) {
      componentMap.delete(entity);
    }

    // Update queries
    for (const queryEntities of this.queries.values()) {
      queryEntities.delete(entity);
    }
  }

  addComponent<T>(entity: Entity, componentName: string, data: T = {} as T): void {
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, data);

    // Update bitmask
    const typeBit = (ComponentTypes as any)[componentName];
    if (typeBit) {
      const oldMask = this.entityMasks.get(entity) || 0;
      const newMask = oldMask | typeBit;
      this.entityMasks.set(entity, newMask);
      this._updateQueriesForEntity(entity, oldMask, newMask);
    }
  }

  removeComponent(entity: Entity, componentName: string): void {
    if (this.components.has(componentName)) {
      this.components.get(componentName)!.delete(entity);

      // Update bitmask
      const typeBit = (ComponentTypes as any)[componentName];
      if (typeBit) {
        const oldMask = this.entityMasks.get(entity) || 0;
        const newMask = oldMask & ~typeBit;
        this.entityMasks.set(entity, newMask);
        this._updateQueriesForEntity(entity, oldMask, newMask);
      }
    }
  }

  getComponent<T>(entity: Entity, componentName: string): T | null {
    const componentMap = this.components.get(componentName);
    return componentMap ? (componentMap.get(entity) as T) || null : null;
  }

  hasComponent(entity: Entity, componentName: string): boolean {
    const componentMap = this.components.get(componentName);
    return componentMap ? componentMap.has(entity) : false;
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system(this, deltaTime);
    }
  }

  getEntitiesWith(...componentNames: string[]): Entity[] {
    let targetMask = 0;
    for (const name of componentNames) {
      const bit = (ComponentTypes as any)[name];
      if (!bit) {
        console.warn(`Component ${name} has no bitmask defined.`);
        return this._getEntitiesWithLegacy(...componentNames);
      }
      targetMask |= bit;
    }

    if (!this.queries.has(targetMask)) {
      this._createQuery(targetMask);
    }

    return Array.from(this.queries.get(targetMask)!);
  }

  private _getEntitiesWithLegacy(...componentNames: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities) {
      const hasAll = componentNames.every((name) => {
        const componentMap = this.components.get(name);
        return componentMap ? componentMap.has(entity) : false;
      });
      if (hasAll) {
        result.push(entity);
      }
    }
    return result;
  }

  private _createQuery(mask: number): void {
    const matchingEntities = new Set<Entity>();
    for (const [entity, entityMask] of this.entityMasks) {
      if ((entityMask & mask) === mask) {
        matchingEntities.add(entity);
      }
    }
    this.queries.set(mask, matchingEntities);
  }

  private _updateQueriesForEntity(entity: Entity, oldMask: number, newMask: number): void {
    for (const [queryMask, entities] of this.queries) {
      const wasMatching = (oldMask & queryMask) === queryMask;
      const isMatching = (newMask & queryMask) === queryMask;

      if (wasMatching && !isMatching) {
        entities.delete(entity);
      } else if (!wasMatching && isMatching) {
        entities.add(entity);
      }
    }
  }
}
