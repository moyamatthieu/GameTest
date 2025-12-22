import { Entity } from './Entity';
import { Component, ComponentConstructor } from './Component';
import { System } from './System';
export declare class World {
    private entities;
    private components;
    private systems;
    private nextEntityId;
    createEntity(): Entity;
    destroyEntity(entity: Entity): void;
    addComponent<T extends Component>(entity: Entity, component: T): void;
    getComponent<T extends Component>(entity: Entity, constructor: ComponentConstructor<T>): T | undefined;
    removeComponent<T extends Component>(entity: Entity, constructor: ComponentConstructor<T>): void;
    hasComponent<T extends Component>(entity: Entity, constructor: ComponentConstructor<T>): boolean;
    addSystem(system: System): void;
    update(dt: number): void;
    getEntitiesWith(...constructors: ComponentConstructor<any>[]): Entity[];
}
