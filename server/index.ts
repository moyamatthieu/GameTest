import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbManager, saveEntity, loadEntities } from './db/index';
import { ServerWorld } from './ecs/ServerWorld';
import { startGameLoop } from './gameLoop';
import { 
  Position, Building, Identity, ProductionChain, 
  Economy, Logistics, Renderable, Planet, Player, Rotation 
} from '../common/ecs/components';
import { BuildingType, UnitType } from '../common/types/game';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const world = new ServerWorld();
const clientStates = new Map<string, any>();

const savedEntities = loadEntities();
if (savedEntities.length > 0) {
    console.log(`Loading ${savedEntities.length} entities from DB...`);
    savedEntities.forEach(entityData => {
        const entity = world.createEntity(entityData.id);
        world.addComponent(entity, 'Position', Position(entityData.x, entityData.y, entityData.z));
        for (const [compName, compData] of Object.entries(entityData.data)) {
            world.addComponent(entity, compName, compData);
        }
    });
} else {
    const planetEntity = world.createEntity();
    world.addComponent(planetEntity, 'Position', Position(0, 0, 0));
    world.addComponent(planetEntity, 'Planet', Planet('terrestre', 100));
    world.addComponent(planetEntity, 'Renderable', Renderable('planet', 0x228b22, { radius: 100 }));
    world.addComponent(planetEntity, 'Identity', Identity('Planet Alpha'));
    
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

startGameLoop(world as any, io, clientStates);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  clientStates.set(socket.id, {
    lastSnapshot: new Map(),
    currentScene: 'planet',
    playerEntity: null,
    playerId: socket.id
  });

  const playerName = `Joueur ${clientStates.size}`;
  const dbPlayer = dbManager.createPlayer(playerName);
  const dbPlayerId = dbPlayer.id;

  const playerEntity = world.createEntity();
  const state = clientStates.get(socket.id);
  state.playerEntity = playerEntity;
  state.dbPlayerId = dbPlayerId;

  world.addComponent(playerEntity, 'Player', { ...Player(playerName), dbId: dbPlayerId });
  world.addComponent(playerEntity, 'Identity', Identity(playerName, dbPlayerId));
  world.addComponent(playerEntity, 'Economy', Economy(1000, 500, 1000));
  world.addComponent(playerEntity, 'Logistics', Logistics());

  const serializedWorld: any[] = [];
  for (const entity of (world as any).entities) {
      const entityData: any = { id: entity, components: {} };
      for (const [componentName, componentMap] of (world as any).components) {
          if (componentMap.has(entity)) {
              entityData.components[componentName] = componentMap.get(entity);
          }
      }
      serializedWorld.push(entityData);
  }

  socket.emit('initWorld', serializedWorld);
  socket.emit('assignedEntity', {
    entityId: playerEntity,
    username: playerName
  });

  socket.on('switchScene', (sceneName) => {
    const state = clientStates.get(socket.id);
    if (state) state.currentScene = sceneName;
  });

  socket.on('moveEntity', ({ id, x, y, z }) => {
    if ((world as any).entities.has(id)) {
        world.addComponent(id, 'Position', Position(x, y, z));
        const components: any = {};
        for (const [compName, compMap] of (world as any).components) {
            if (compMap.has(id)) components[compName] = compMap.get(id);
        }
        saveEntity({ id, components });
        io.emit('entityMoved', { id, x, y, z });
    }
  });

  socket.on('requestPlacement', ({ type, x, y, z, rotX, rotY, rotZ, mode, playerId }) => {
    const costs: Record<string, { metal: number }> = {
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

    const economy = world.getComponent<any>(ecsPlayerId, 'Economy');
    const playerComp = world.getComponent<any>(ecsPlayerId, 'Player');
    const playerName = playerComp ? playerComp.username : 'Inconnu';

    if (economy && economy.metal >= cost.metal) {
      economy.metal -= cost.metal;
      const referenceFrame = mode === 'PLANET' ? 'planet_surface' : 'orbital';
      const building = world.createEntity();
      world.addComponent(building, 'Building', Building(type as BuildingType));
      world.addComponent(building, 'Position', Position(x, y || 0, z, referenceFrame));
      world.addComponent(building, 'Identity', Identity(`${type} de ${playerName}`, dbPlayerId));
      world.addComponent(building, 'Renderable', Renderable('building', 0x808080, { buildingType: type }));

      if (rotX !== undefined && rotY !== undefined && rotZ !== undefined) {
        world.addComponent(building, 'Rotation', Rotation(rotX, rotY, rotZ));
      }

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
    } else {
      socket.emit('requestRejected', { reason: 'Insufficient resources' });
    }
  });

  socket.on('disconnect', () => {
    clientStates.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
