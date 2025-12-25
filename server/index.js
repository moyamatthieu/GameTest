import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import db, { saveEntity, loadEntities, dbManager } from './db/index.js';
import { ServerWorld } from './ecs/ServerWorld.js';
import { startGameLoop } from './gameLoop.js';
import { Position, Building, Identity, ProductionChain, Economy, Logistics, Renderable, Planet, Specialization, Player, Rotation } from '../common/ecs/components.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*", // Pour le dev, à restreindre en prod
    methods: ["GET", "POST"]
  }
});

// Initialisation du monde ECS
const world = new ServerWorld();

// Suivi des joueurs pour le dev (ID séquentiel)
let totalPlayersCreated = 0;

// Suivi des états par client pour la Delta Compression
const clientStates = new Map(); // socket.id -> { lastSnapshot: Map(entityId -> components) }

// Charger les entités depuis la DB
const savedEntities = loadEntities();
if (savedEntities.length > 0) {
    console.log(`Loading ${savedEntities.length} entities from DB...`);
    savedEntities.forEach(entityData => {
        const entity = world.createEntity(entityData.id);
        world.addComponent(entity, 'Position', Position(entityData.x, entityData.y, entityData.z));

        // Restaurer les autres composants
        for (const [compName, compData] of Object.entries(entityData.data)) {
            world.addComponent(entity, compName, compData);
        }
    });
} else {
    // Créer la planète sur le serveur (si aucune entité n'existe)
    const planetEntity = world.createEntity();
    world.addComponent(planetEntity, 'Position', Position(0, 0, 0));
    world.addComponent(planetEntity, 'Planet', Planet('terrestre', 100));
    world.addComponent(planetEntity, 'Renderable', Renderable('planet', 0x228b22, { radius: 100 }));
    world.addComponent(planetEntity, 'Identity', Identity('Planet Alpha'));
    console.log('Created initial planet entity:', planetEntity);

    saveEntity({
        id: planetEntity,
        components: {
          Position: Position(0, 0, 0),
          Renderable: Renderable('planet', 0x228b22, { radius: 100 }),
          Identity: Identity('Planet Alpha'),
          Planet: Planet('terrestre', 100)
        }
    });
}

startGameLoop(world, io, clientStates);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Initialiser l'état du client
  clientStates.set(socket.id, {
    lastSnapshot: new Map(),
    currentScene: 'planet', // Scène par défaut
    playerEntity: null, // Sera défini après la création
    playerId: socket.id
  });

  // Gestion de l'identité du joueur (Dev mode: séquentiel)
  totalPlayersCreated++;
  const playerName = `Joueur ${totalPlayersCreated}`;

  // Créer le joueur en DB pour satisfaire les contraintes de clé étrangère
  const dbPlayer = dbManager.createPlayer(playerName);
  const dbPlayerId = dbPlayer.id;

  // Créer l'entité joueur AVANT de sérialiser le monde
  const playerEntity = world.createEntity();

  // Mettre à jour l'état du client avec l'entité
  const state = clientStates.get(socket.id);
  state.playerEntity = playerEntity;
  state.dbPlayerId = dbPlayerId;

  world.addComponent(playerEntity, 'Player', { ...Player(playerName), dbId: dbPlayerId });
  world.addComponent(playerEntity, 'Identity', Identity(playerName, dbPlayerId));
  world.addComponent(playerEntity, 'Economy', Economy(1000, 500, 1000));
  world.addComponent(playerEntity, 'Logistics', Logistics());

  console.log(`Assigned ${playerName} to entity ${playerEntity}`);

  // Sérialiser le monde (incluant maintenant le nouveau joueur)
  const serializedWorld = [];
  for (const entity of world.entities) {
      const entityData = {
          id: entity,
          components: {}
      };

      for (const [componentName, componentMap] of world.components) {
          if (componentMap.has(entity)) {
              entityData.components[componentName] = componentMap.get(entity);
          }
      }
      serializedWorld.push(entityData);
  }

  socket.emit('initWorld', serializedWorld);

  // Informer le client de son entité et de son nom
  socket.emit('assignedEntity', {
    entityId: playerEntity,
    username: playerName
  });

  // Gérer le changement de scène (AOI)
  socket.on('switchScene', (sceneName) => {
    const state = clientStates.get(socket.id);
    if (state) {
      state.currentScene = sceneName;
      console.log(`Client ${socket.id} switched to scene ${sceneName}`);
    }
  });

  socket.on('moveEntity', ({ id, x, y, z }) => {
    console.log(`Received moveEntity for ${id} to ${x}, ${y}, ${z}`);

    // Vérifier si l'entité existe
    if (world.entities.has(id)) {
        // Mettre à jour la position dans l'ECS
        world.addComponent(id, 'Position', Position(x, y, z));

        // Préparer les données pour la sauvegarde
        const components = {};
        for (const [compName, compMap] of world.components) {
            if (compMap.has(id)) {
                components[compName] = compMap.get(id);
            }
        }

        // Sauvegarder en DB
        saveEntity({ id, components });
        console.log(`Entity ${id} saved to DB`);

        // Diffuser aux clients
        io.emit('entityMoved', { id, x, y, z });
    } else {
        console.warn(`Entity ${id} not found in world`);
    }
  });

  socket.on('requestPlacement', ({ type, x, y, z, rotX, rotY, rotZ, mode, playerId }) => {
    console.log(`Received requestPlacement for ${type} at (${x}, ${y || 0}, ${z}) from ${playerId} (Mode: ${mode})`);

    // 1. Validation (Simplifiée pour le MVP)
    const costs = {
      base: { metal: 100 },
      habitation: { metal: 30 },
      ferme: { metal: 40 },
      usine: { metal: 60 },
      entrepot: { metal: 50 },
      centrale: { metal: 80 },
      mine: { metal: 120 },
      route: { metal: 5 }
    };

    const cost = costs[type] || { metal: 0 };
    const state = clientStates.get(socket.id);
    const ecsPlayerId = state.playerEntity;
    const dbPlayerId = state.dbPlayerId;

    const economy = world.getComponent(ecsPlayerId, 'Economy');
    const playerComp = world.getComponent(ecsPlayerId, 'Player');
    const playerName = playerComp ? playerComp.username : 'Inconnu';

    if (economy && economy.metal >= cost.metal) {
      // Déduire les ressources
      economy.metal -= cost.metal;

      // Déterminer le referenceFrame selon le mode
      const referenceFrame = mode === 'PLANET' ? 'planet_surface' : 'orbital';

      // Créer l'entité sur le serveur avec les vraies coordonnées
      const building = world.createEntity();
      world.addComponent(building, 'Building', Building(type));
      world.addComponent(building, 'Position', Position(x, y || 0, z, referenceFrame));
      world.addComponent(building, 'Identity', Identity(`${type} de ${playerName}`, dbPlayerId));
      world.addComponent(building, 'Renderable', Renderable('building', 0x808080, { buildingType: type }));

      // Ajouter la rotation pour l'orientation correcte sur la planète
      if (rotX !== undefined && rotY !== undefined && rotZ !== undefined) {
        world.addComponent(building, 'Rotation', Rotation(rotX, rotY, rotZ));
      }

      // Composants spécifiques
      switch (type) {
        case 'mine':
          world.addComponent(building, 'ProductionChain', ProductionChain({ energy: 1 }, { metal: 5 }, 1000));
          break;
        case 'centrale':
          world.addComponent(building, 'ProductionChain', ProductionChain({}, { energy: 10 }, 1000));
          break;
        case 'usine':
          world.addComponent(building, 'ProductionChain', ProductionChain({ metal: 10, energy: 5 }, { credits: 20 }, 5000));
          break;
      }

      console.log(`Placement validated and created: ${building}`);

      // La sauvegarde en DB et le broadcast seront gérés par le snapshot ou manuellement ici
      // Pour l'instant on laisse le snapshot s'en charger à 10Hz
    } else {
      console.warn(`Placement rejected: insufficient resources for ${playerId}`);
      socket.emit('requestRejected', { reason: 'Insufficient resources' });
    }
  });

  socket.on('requestTransfer', ({ resource, amount, playerId, targetEntityId }) => {
    console.log(`Received requestTransfer: ${amount} ${resource} from ${playerId} to ${targetEntityId}`);

    const economy = world.getComponent(playerId, 'Economy');
    const logistics = world.getComponent(playerId, 'Logistics');

    if (economy && economy[resource] >= amount && logistics) {
      economy[resource] -= amount;
      logistics.transfers.push({
        resource,
        amount,
        remainingTime: 5,
        targetEntityId
      });
      console.log(`Transfer started on server for ${playerId}`);
    } else {
      console.warn(`Transfer rejected for ${playerId}`);
      socket.emit('requestRejected', { reason: 'Insufficient resources or missing logistics' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    clientStates.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Server ready

