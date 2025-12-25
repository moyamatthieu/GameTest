import { DatabaseManager } from './DatabaseManager.js';

export const dbManager = new DatabaseManager();

console.log('Database connected via DatabaseManager (Schema v2).');

export const saveEntity = (entityData) => {
  const { id, components } = entityData;

  try {
    const existing = dbManager.getEntity(id);
    if (existing) {
      dbManager.updateEntity(id, {
        type: components.type || 'unknown',
        owner_id: components.owner_id || null,
        components
      });
    } else {
      dbManager.createEntity({
        id,
        type: components.type || 'unknown',
        owner_id: components.owner_id || null,
        components
      });
    }
  } catch (e) {
    console.error('Error in saveEntity (legacy wrapper):', e);
  }
};

export const loadEntities = () => {
  try {
    const entities = dbManager.getAllEntitiesSync();
    return entities.map(e => ({
      id: e.id,
      x: e.components.Position?.x || 0,
      y: e.components.Position?.y || 0,
      z: e.components.Position?.z || 0,
      data: e.components
    }));
  } catch (e) {
    console.error('Error in loadEntities (legacy wrapper):', e);
    return [];
  }
};

export default dbManager.db;
