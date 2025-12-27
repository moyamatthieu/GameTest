export interface Component {}

export type Entity = number;

export class World {
  private nextEntityId: Entity = 0;
  private entities: Set<Entity> = new Set();
  private components: Map<string, Map<Entity, Component>> = new Map();

  createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    return entity;
  }

  destroyEntity(entity: Entity) {
    this.entities.delete(entity);
    this.components.forEach(componentMap => {
      componentMap.delete(entity);
    });
  }

  addComponent(entity: Entity, component: Component) {
    const componentName = component.constructor.name;
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, component);
  }

  getComponent<T extends Component>(entity: Entity, componentClass: new (...args: any[]) => T): T | undefined {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    if (componentMap) {
      return componentMap.get(entity) as T;
    }
    return undefined;
  }

  getEntitiesWith(...componentClasses: (new (...args: any[]) => Component)[]): Entity[] {
    if (componentClasses.length === 0) return Array.from(this.entities);

    const componentNames = componentClasses.map(c => c.name);
    const firstComponentName = componentNames[0];
    const firstComponentMap = this.components.get(firstComponentName);

    if (!firstComponentMap) return [];

    const result: Entity[] = [];
    for (const entity of firstComponentMap.keys()) {
      let hasAll = true;
      for (let i = 1; i < componentNames.length; i++) {
        const componentMap = this.components.get(componentNames[i]);
        if (!componentMap || !componentMap.has(entity)) {
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

  serialize(): any {
    return {
      nextEntityId: this.nextEntityId,
      entities: Array.from(this.entities),
      components: Array.from(this.components.entries()).map(([name, map]) => [
        name,
        Array.from(map.entries()),
      ]),
    };
  }

  deserialize(data: any) {
    this.nextEntityId = data.nextEntityId;
    this.entities = new Set(data.entities);
    this.components = new Map();

    for (const [name, entries] of data.components) {
      this.components.set(name, new Map(entries));
    }
  }
}
