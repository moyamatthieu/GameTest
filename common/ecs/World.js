import { ComponentTypes } from './components.js';

export class World {
  constructor() {
    this.entities = new Set();
    this.components = new Map(); // Map<componentName, Map<entityId, componentData>>
    this.entityMasks = new Map(); // Map<entityId, bitmask>
    this.systems = [];
    this.queries = new Map(); // Map<mask, Set<entityId>>
    this.nextEntityId = 0;
    this.onEntityAdded = null;
    this.onEntityRemoved = null;
  }

  createEntity(requestedId = null) {
    let entity;
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

  destroyEntity(entity) {
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

  addComponent(entity, componentName, data = {}) {
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName).set(entity, data);

    // Update bitmask
    const typeBit = ComponentTypes[componentName];
    if (typeBit) {
      const oldMask = this.entityMasks.get(entity) || 0;
      const newMask = oldMask | typeBit;
      this.entityMasks.set(entity, newMask);
      this._updateQueriesForEntity(entity, oldMask, newMask);
    }
  }

  removeComponent(entity, componentName) {
    if (this.components.has(componentName)) {
      this.components.get(componentName).delete(entity);

      // Update bitmask
      const typeBit = ComponentTypes[componentName];
      if (typeBit) {
        const oldMask = this.entityMasks.get(entity) || 0;
        const newMask = oldMask & ~typeBit;
        this.entityMasks.set(entity, newMask);
        this._updateQueriesForEntity(entity, oldMask, newMask);
      }
    }
  }

  getComponent(entity, componentName) {
    return this.components.has(componentName) ? this.components.get(componentName).get(entity) : null;
  }

  hasComponent(entity, componentName) {
    return this.components.has(componentName) && this.components.get(componentName).has(entity);
  }

  addSystem(system) {
    this.systems.push(system);
  }

  update(deltaTime) {
    for (const system of this.systems) {
      system(this, deltaTime);
    }
  }

  /**
   * Retourne les entités ayant TOUS les composants spécifiés.
   * Utilise un système de cache (Queries) basé sur les bitmasks.
   */
  getEntitiesWith(...componentNames) {
    let targetMask = 0;
    for (const name of componentNames) {
      const bit = ComponentTypes[name];
      if (!bit) {
        // Si un composant n'a pas de bitmask, on retombe sur l'ancienne méthode (lent)
        // ou on ignore. Pour la Phase 2, on s'attend à ce que tout soit bitmaské.
        console.warn(`Component ${name} has no bitmask defined.`);
        return this._getEntitiesWithLegacy(...componentNames);
      }
      targetMask |= bit;
    }

    if (!this.queries.has(targetMask)) {
      this._createQuery(targetMask);
    }

    return Array.from(this.queries.get(targetMask));
  }

  _getEntitiesWithLegacy(...componentNames) {
    const result = [];
    for (const entity of this.entities) {
      const hasAll = componentNames.every((name) => this.components.has(name) && this.components.get(name).has(entity));
      if (hasAll) {
        result.push(entity);
      }
    }
    return result;
  }

  _createQuery(mask) {
    const matchingEntities = new Set();
    for (const [entity, entityMask] of this.entityMasks) {
      if ((entityMask & mask) === mask) {
        matchingEntities.add(entity);
      }
    }
    this.queries.set(mask, matchingEntities);
  }

  _updateQueriesForEntity(entity, oldMask, newMask) {
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
