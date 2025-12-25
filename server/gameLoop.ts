import { Server } from 'socket.io';
import { IWorld } from '../common/types/ecs';
import { NetworkProtocol } from './network/Protocol';
import { InterestManager } from './network/InterestManager';
import { DatabaseManager } from './db/DatabaseManager';
import { EntityCache } from './db/EntityCache';

interface ClientState {
  playerId: string;
  playerEntityId?: number;
  lastSnapshot: Map<number, any>;
}

export function startGameLoop(
  world: IWorld & { entities: Set<number>; components: Map<string, Map<number, any>> }, 
  io: Server, 
  clientStates: Map<string, ClientState>, 
  tickRate = 10
) {
  const protocol = new NetworkProtocol();
  const interestManager = new InterestManager(1000);
  const databaseManager = new DatabaseManager();
  const entityCache = new EntityCache(databaseManager, 5000);

  const tickInterval = 1000 / tickRate;
  let lastTime = Date.now();

  const metricsTimer = setInterval(() => {
    const protocolMetrics = protocol.getMetrics();
    const interestMetrics = interestManager.getMetrics();
    const cacheMetrics = entityCache.getMetrics();
    const dbMetrics = databaseManager.getMetrics();

    console.log('\n=== Network Performance Metrics ===');
    console.log('Protocol:', protocolMetrics);
    console.log('Interest Management:', interestMetrics);
    console.log('Database Cache:', cacheMetrics);
    console.log('Database:', dbMetrics);
    console.log('===================================\n');

    protocol.resetMetrics();
    entityCache.resetMetrics();
  }, 10000);

  const gameLoopInterval = setInterval(() => {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    try {
      world.update(deltaTime);

      const entityUpdates: Record<number, any> = {};

      for (const entity of world.entities) {
        let position = { x: 0, y: 0, z: 0 };
        let entityData: any = { id: entity, components: {} };

        const posComp = world.getComponent<any>(entity, 'Position');
        if (posComp) {
          position = { x: posComp.x || 0, y: posComp.y || 0, z: posComp.z || 0 };
        }

        for (const [componentName, componentMap] of world.components) {
          if (componentMap.has(entity)) {
            entityData.components[componentName] = componentMap.get(entity);
          }
        }

        interestManager.updateEntity(entity, position, entityData);
        entityUpdates[entity] = entityData;
      }

      if (Object.keys(entityUpdates).length > 0) {
        entityCache.updateEntities(entityUpdates, { immediate: false });
      }

      for (const [socketId, clientState] of clientStates.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) continue;

        if (clientState.playerId) {
          let playerPosition = { x: 0, y: 0, z: 0 };
          const playerEntity = clientState.playerEntityId;
          if (playerEntity) {
            const posComp = world.getComponent<any>(playerEntity, 'Position');
            if (posComp) {
              playerPosition = { x: posComp.x || 0, y: posComp.y || 0, z: posComp.z || 0 };
            }
          }
          interestManager.updatePlayerPosition(clientState.playerId, playerPosition);
        }

        const allEntities: any[] = [];
        for (const entity of world.entities) {
          let entityData: any = { id: entity, components: {} };
          for (const [componentName, componentMap] of world.components) {
            if (componentMap.has(entity)) {
              entityData.components[componentName] = componentMap.get(entity);
            }
          }
          allEntities.push(entityData);
        }

        const filteredEntities = interestManager.filterEntitiesForPlayer(
          clientState.playerId,
          allEntities
        );

        const deltaSnapshot: any[] = [];
        for (const entityData of filteredEntities) {
          const entity = entityData.id;
          let hasChanged = false;
          const lastEntityState = clientState.lastSnapshot.get(entity);

          const entityDelta: any = { id: entity, components: {} };

          for (const [componentName, componentData] of Object.entries(entityData.components)) {
            const lastCompJson = lastEntityState ? lastEntityState[componentName] : null;
            const currentCompJson = JSON.stringify(componentData);

            if (lastCompJson !== currentCompJson) {
              entityDelta.components[componentName] = componentData;
              hasChanged = true;
            }
          }

          if (hasChanged) {
            deltaSnapshot.push(entityDelta);
          }
        }

        if (deltaSnapshot.length > 0) {
          const snapshotData = {
            type: 'worldDelta',
            entities: deltaSnapshot,
            timestamp: Date.now()
          };

          const compressedDelta = protocol.createDeltaSnapshot(
            clientState.playerId,
            snapshotData
          );

          if (compressedDelta) {
            socket.emit('worldDelta', compressedDelta);
          }
        }

        const nextLastSnapshot = new Map<number, any>();
        for (const entity of world.entities) {
          const entityComps: any = {};
          for (const [componentName, componentMap] of world.components) {
            if (componentMap.has(entity)) {
              entityComps[componentName] = JSON.stringify(componentMap.get(entity));
            }
          }
          nextLastSnapshot.set(entity, entityComps);
        }
        clientState.lastSnapshot = nextLastSnapshot;
      }

    } catch (error) {
      console.error('Error in game loop:', error);
    }
  }, tickInterval);

  return () => {
    clearInterval(metricsTimer);
    clearInterval(gameLoopInterval);
    protocol.resetMetrics();
    interestManager.clear();

    entityCache.flush().then(() => {
      entityCache.destroy();
      databaseManager.close();
    }).catch(error => {
      console.error('Error during final cache flush:', error);
      entityCache.destroy();
      databaseManager.close();
    });
  };
}
