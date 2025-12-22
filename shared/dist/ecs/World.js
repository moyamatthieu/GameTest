export class World {
    entities = new Set();
    components = new Map();
    systems = [];
    nextEntityId = 0;
    createEntity() {
        const entity = (this.nextEntityId++).toString();
        this.entities.add(entity);
        return entity;
    }
    destroyEntity(entity) {
        this.entities.delete(entity);
        for (const componentMap of this.components.values()) {
            componentMap.delete(entity);
        }
    }
    addComponent(entity, component) {
        const type = component._type;
        if (!this.components.has(type)) {
            this.components.set(type, new Map());
        }
        this.components.get(type).set(entity, component);
    }
    getComponent(entity, constructor) {
        const type = constructor.TYPE;
        const componentMap = this.components.get(type);
        return componentMap ? componentMap.get(entity) : undefined;
    }
    removeComponent(entity, constructor) {
        const type = constructor.TYPE;
        this.components.get(type)?.delete(entity);
    }
    hasComponent(entity, constructor) {
        const type = constructor.TYPE;
        return this.components.get(type)?.has(entity) ?? false;
    }
    addSystem(system) {
        this.systems.push(system);
    }
    update(dt) {
        for (const system of this.systems) {
            system.update(dt, this);
        }
    }
    getEntitiesWith(...constructors) {
        if (constructors.length === 0)
            return Array.from(this.entities);
        const types = constructors.map(c => c.TYPE);
        const firstType = types[0];
        const firstMap = this.components.get(firstType);
        if (!firstMap)
            return [];
        const result = [];
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
//# sourceMappingURL=World.js.map