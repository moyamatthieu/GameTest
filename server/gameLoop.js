import { NetworkProtocol } from './network/Protocol.js';
import { InterestManager } from './network/InterestManager.js';
import { DatabaseManager } from './db/DatabaseManager.js';
import { EntityCache } from './db/EntityCache.js';

export function startGameLoop(world, io, clientStates, tickRate = 10) {
  // Initialiser le protocole réseau et l'interest manager
  const protocol = new NetworkProtocol();
  const interestManager = new InterestManager(1000); // Cell size = 1000 units

  // Initialiser le nouveau système de persistance
  const databaseManager = new DatabaseManager();
  const entityCache = new EntityCache(databaseManager, 5000); // Write-back toutes les 5 secondes

  const tickInterval = 1000 / tickRate;
  let lastTime = Date.now();

  console.log(`Starting game loop at ${tickRate} ticks/s`);
  console.log('Network optimizations enabled:');
  console.log('  - MessagePack serialization');
  console.log('  - Delta compression');
  console.log('  - Spatial hashing (Interest Management)');
  console.log('Database optimizations enabled:');
  console.log('  - Entity cache with write-back (5s interval)');
  console.log('  - Granular schema v2 with spatial indexing');
  console.log('  - Batch updates and prepared statements');

  // Métriques de performance
  let metricsTimer = setInterval(() => {
    const protocolMetrics = protocol.getMetrics();
    const interestMetrics = interestManager.getMetrics();
    const cacheMetrics = entityCache.getMetrics();
    const dbMetrics = databaseManager.getMetrics();

    console.log('\n=== Network Performance Metrics ===');
    console.log('Protocol:');
    console.log(`  Packets Sent: ${protocolMetrics.packetsSent}`);
    console.log(`  Total Bytes Sent: ${protocolMetrics.totalBytesSent}`);
    console.log(`  Average Packet Size: ${protocolMetrics.averagePacketSize} bytes`);
    console.log(`  Compression Ratio: ${protocolMetrics.compressionRatio}`);
    console.log('Interest Management:');
    console.log(`  Total Entities: ${interestMetrics.totalEntities}`);
    console.log(`  Entities Sent: ${interestMetrics.averageEntitiesPerUpdate}`);
    console.log(`  Reduction Ratio: ${interestMetrics.reductionRatio}`);
    console.log(`  Active Players: ${interestMetrics.activePlayers}`);
    console.log('Database Cache:');
    console.log(`  Cache Size: ${cacheMetrics.cacheSize}`);
    console.log(`  Cache Hit Rate: ${(cacheMetrics.hitRate * 100).toFixed(1)}%`);
    console.log(`  Writes Deferred: ${cacheMetrics.writesDeferred}`);
    console.log(`  Writes Executed: ${cacheMetrics.writesExecuted}`);
    console.log(`  Dirty Entities: ${cacheMetrics.dirtyCount}`);
    console.log('Database:');
    console.log(`  Total Entities: ${dbMetrics.totalEntities}`);
    console.log(`  DB Size: ${(dbMetrics.databaseSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('===================================\n');

    protocol.resetMetrics();
    entityCache.resetMetrics();
  }, 10000); // Toutes les 10 secondes

  setInterval(() => {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000; // en secondes
    lastTime = currentTime;

    try {
      world.update(deltaTime);

      // Mettre à jour les entités dans le cache et l'Interest Manager
      const entityUpdates = {};

      for (const entity of world.entities) {
        // Extraire la position de l'entité
        let position = { x: 0, y: 0, z: 0 };
        let entityData = { id: entity, components: {} };

        // Récupérer les composants de position
        if (world.components.has('Position')) {
          const posComp = world.components.get('Position').get(entity);
          if (posComp) {
            position = { x: posComp.x || 0, y: posComp.y || 0, z: posComp.z || 0 };
          }
        }

        // Collecter tous les composants
        for (const [componentName, componentMap] of world.components) {
          if (componentMap.has(entity)) {
            entityData.components[componentName] = componentMap.get(entity);
          }
        }

        // Mettre à jour l'entité dans l'Interest Manager
        interestManager.updateEntity(entity, position, entityData);

        // Préparer la mise à jour pour le cache (uniquement si modifié)
        entityUpdates[entity] = entityData;
      }

      // Mettre à jour le cache en batch (écritures différées)
      if (Object.keys(entityUpdates).length > 0) {
        entityCache.updateEntities(entityUpdates, { immediate: false });
      }

      // Pour chaque client, calculer et envoyer le delta optimisé
      for (const [socketId, clientState] of clientStates.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) continue;

        // Mettre à jour la position du joueur dans l'Interest Manager
        if (clientState.playerId) {
          const playerPosition = { x: 0, y: 0, z: 0 };
          // Récupérer la position du joueur (à adapter selon votre implémentation)
          if (world.components.has('Position')) {
            const playerEntity = clientState.playerEntityId;
            if (playerEntity && world.components.get('Position').has(playerEntity)) {
              const posComp = world.components.get('Position').get(playerEntity);
              playerPosition.x = posComp.x || 0;
              playerPosition.y = posComp.y || 0;
              playerPosition.z = posComp.z || 0;
            }
          }
          interestManager.updatePlayerPosition(clientState.playerId, playerPosition);
        }

        // Filtrer les entités avec l'Interest Manager
        const allEntities = [];
        for (const entity of world.entities) {
          let entityData = {
            id: entity,
            components: {}
          };

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

        // Appliquer le delta compression et la sérialisation MessagePack
        const deltaSnapshot = [];
        const currentSnapshot = new Map();

        for (const entityData of filteredEntities) {
          const entity = entityData.id;
          let hasChanged = false;
          const lastEntityState = clientState.lastSnapshot.get(entity);

          const entityDelta = {
            id: entity,
            components: {}
          };

          for (const [componentName, componentData] of Object.entries(entityData.components)) {
            currentSnapshot.set(`${entity}-${componentName}`, JSON.stringify(componentData));

            // Delta Compression: comparer avec le dernier état envoyé
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

        // Envoyer le delta compressé si il y a des changements
        if (deltaSnapshot.length > 0) {
          const snapshotData = {
            type: 'worldDelta',
            entities: deltaSnapshot,
            timestamp: Date.now()
          };

          // Créer un delta compressé avec le protocole
          const compressedDelta = protocol.createDeltaSnapshot(
            clientState.playerId,
            snapshotData
          );

          if (compressedDelta) {
            socket.emit('worldDelta', compressedDelta);
          }
        }

        // Mettre à jour le dernier état connu pour ce client
        const nextLastSnapshot = {};
        for (const entity of world.entities) {
          nextLastSnapshot[entity] = {};
          for (const [componentName, componentMap] of world.components) {
            if (componentMap.has(entity)) {
              nextLastSnapshot[entity][componentName] = JSON.stringify(componentMap.get(entity));
            }
          }
        }
        clientState.lastSnapshot = new Map(Object.entries(nextLastSnapshot).map(([k, v]) => [parseInt(k), v]));
      }

    } catch (error) {
      console.error('Error in game loop:', error);
    }
  }, tickInterval);

  // Nettoyage lorsque le serveur s'arrête
  return () => {
    clearInterval(metricsTimer);
    protocol.resetMetrics();
    interestManager.clear();

    // Forcer la sauvegarde finale du cache
    entityCache.flush().then(() => {
      console.log('Final cache flush completed');
      entityCache.destroy();
      databaseManager.close();
    }).catch(error => {
      console.error('Error during final cache flush:', error);
      entityCache.destroy();
      databaseManager.close();
    });
  };
}
