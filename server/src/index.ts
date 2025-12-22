import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { 
  World, Position, Velocity, Input, MovementSystem, InputState,
  Stats, CombatState, CombatSystem, CombatEvent, Renderable, RenderType,
  Inventory, InventorySystem, NPC, NPCType, QuestState, QuestStatus,
  QuestObjectiveType, Quest, RECIPES, CHAT_MESSAGE, ChatMessage, Identity,
  Equipment, EquipmentSystem, EquipmentSlot, ITEMS
} from 'shared';
import { AISystem } from './game/AISystem';
import { QuestSystem } from './game/QuestSystem';

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  if (req.url === '/favicon.ico') {
    res.status(204).end();
    return;
  }
  console.log(`${req.method} ${req.url}`);
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

// Debug logs for Socket.io
io.engine.on("connection_error", (err) => {
  console.log("Connection Error:", err.req);      // the request object
  console.log("Error Code:", err.code);     // the error code, for example 1
  console.log("Error Message:", err.message);  // the error message, for example "Session ID unknown"
  console.log("Error Context:", err.context);  // some additional error context
});

const world = new World();
const movementSystem = new MovementSystem();
const inventorySystem = new InventorySystem();
const equipmentSystem = new EquipmentSystem();
const aiSystem = new AISystem();
const questSystem = new QuestSystem(inventorySystem);

// Sample Quest
const woodQuest: Quest = {
  id: 'wood_quest',
  title: 'Collecter du bois',
  description: 'Apportez 5 unités de bois au garde.',
  objectives: [
    {
      type: QuestObjectiveType.COLLECT,
      targetId: 'wood',
      requiredAmount: 5,
      currentAmount: 0,
      description: 'Bois collecté'
    }
  ],
  rewards: {
    items: [{ itemId: 'iron', amount: 2 }]
  },
  status: QuestStatus.AVAILABLE
};

const combatSystem = new CombatSystem((event: CombatEvent) => {
  io.emit('COMBAT_LOG', event);
  
  if (event.type === 'death') {
    io.emit('ENTITY_DIED', { entityId: event.targetId });
    console.log(`Entity ${event.targetId} died!`);

    // Update quest progress for all players if the target was an enemy
    const targetNpc = world.getComponent(event.targetId, NPC);
    if (targetNpc && targetNpc.npcType === NPCType.ENEMY) {
      for (const playerEntity of playerEntities.values()) {
        questSystem.updateProgress(playerEntity, QuestObjectiveType.KILL, 'enemy', 1, world);
        // Sync quest state
        const qs = world.getComponent(playerEntity, QuestState);
        const socketId = Array.from(playerEntities.entries()).find(([_, id]) => id === playerEntity)?.[0];
        if (qs && socketId) {
          io.to(socketId).emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
        }
      }
    }

    // Simple respawn logic
    const stats = world.getComponent(event.targetId, Stats);
    const pos = world.getComponent(event.targetId, Position);
    if (stats && pos) {
      stats.hp = stats.maxHp;
      pos.x = 0;
      pos.z = 0;
    }
  }
});

world.addSystem(movementSystem);
world.addSystem(aiSystem);
world.addSystem(equipmentSystem);
world.addSystem(combatSystem);
world.addSystem(inventorySystem);

// Create a Quest Giver NPC
const questGiver = world.createEntity();
world.addComponent(questGiver, new Position(5, 0, 5));
world.addComponent(questGiver, new Velocity());
world.addComponent(questGiver, new NPC('Garde Forestier', NPCType.QUEST_GIVER));
world.addComponent(questGiver, new Renderable(RenderType.PLAYER, 0x0000ff)); // Blue for NPC
world.addComponent(questGiver, new Stats(1000, 1000));

// Create some Enemies
for (let i = 0; i < 3; i++) {
  const enemy = world.createEntity();
  world.addComponent(enemy, new Position(Math.random() * 20 - 10, 0, Math.random() * 20 - 10));
  world.addComponent(enemy, new Velocity());
  world.addComponent(enemy, new NPC(`Loup ${i + 1}`, NPCType.ENEMY));
  world.addComponent(enemy, new Renderable(RenderType.PLAYER, 0xff0000)); // Red for Enemy
  world.addComponent(enemy, new Stats(50, 50));
  world.addComponent(enemy, new CombatState());
}

// Map pour stocker les entités par socket
const playerEntities = new Map<string, string>();
// Map pour stocker le dernier numéro de séquence traité par joueur
const lastProcessedSequence = new Map<string, number>();

interface PlayerAccount {
  id: number;
  lastName: string;
  connectedCharacterEntity: string | null;
}

const accounts = new Map<number, PlayerAccount>();
let nextPlayerId = 1;

// Noms de famille prédéfinis pour le test
const FAMILY_NAMES = ['Lefebvre', 'Dubois', 'Moreau', 'Laurent', 'Girard'];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Simulation d'un compte joueur (on prend le prochain ID disponible pour le test)
  // Dans un vrai système, on utiliserait une authentification
  const playerId = nextPlayerId++;
  let account = accounts.get(playerId);
  
  if (!account) {
    account = {
      id: playerId,
      lastName: FAMILY_NAMES[(playerId - 1) % FAMILY_NAMES.length],
      connectedCharacterEntity: null
    };
    accounts.set(playerId, account);
  }

  // Vérification si un personnage est déjà connecté pour ce compte
  if (account.connectedCharacterEntity) {
    console.log(`Player ${playerId} already has a connected character. Disconnecting old one.`);
    // Dans ce dev, on va juste détruire l'ancienne entité si elle existe encore
    world.destroyEntity(account.connectedCharacterEntity);
  }

  // Create an entity for the player (Personnage 1 par défaut pour le dev)
  const characterIndex = 1; 
  const playerEntity = world.createEntity();
  playerEntities.set(socket.id, playerEntity);
  lastProcessedSequence.set(socket.id, 0);
  account.connectedCharacterEntity = playerEntity;

  world.addComponent(playerEntity, new Position());
  world.addComponent(playerEntity, new Velocity());
  world.addComponent(playerEntity, new Input());
  world.addComponent(playerEntity, new Stats());
  world.addComponent(playerEntity, new CombatState());
  world.addComponent(playerEntity, new Inventory());
  world.addComponent(playerEntity, new Equipment());
  world.addComponent(playerEntity, new QuestState());
  world.addComponent(playerEntity, new Renderable(RenderType.PLAYER, 0x00ff00));
  
  // Ajout de l'identité
  const firstName = `Perso${characterIndex}`;
  world.addComponent(playerEntity, new Identity(firstName, account.lastName));

  // Add some starting items for testing
  inventorySystem.addItem(playerEntity, 'wood', 5, world);
  inventorySystem.addItem(playerEntity, 'iron', 2, world);
  inventorySystem.addItem(playerEntity, 'sword', 1, world);
  inventorySystem.addItem(playerEntity, 'shield', 1, world);

  console.log(`Created entity ${playerEntity} for player ${socket.id}`);
  socket.emit('WELCOME', { entityId: playerEntity });

  // Initial inventory sync
  const inv = world.getComponent(playerEntity, Inventory) as Inventory;
  if (inv) {
    socket.emit('INVENTORY_UPDATE', { items: inv.items });
  }

  // Initial equipment sync
  const eq = world.getComponent(playerEntity, Equipment) as Equipment;
  if (eq) {
    socket.emit('EQUIPMENT_UPDATE', { slots: eq.slots });
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    world.destroyEntity(playerEntity);
    playerEntities.delete(socket.id);
    lastProcessedSequence.delete(socket.id);
    
    // Libérer le personnage du compte
    if (account) {
      account.connectedCharacterEntity = null;
    }
  });

  socket.on('PLAYER_INPUT', (data: { sequence: number; state: InputState }) => {
    const entity = playerEntities.get(socket.id);
    if (entity) {
      const input = world.getComponent(entity, Input);
      if (input) {
        input.state = data.state;
        input.sequence = data.sequence;
        lastProcessedSequence.set(socket.id, data.sequence);
      }
    }
  });

  socket.on('TARGET_CHANGED', (data: { targetId: string | null }) => {
    const entity = playerEntities.get(socket.id);
    if (entity) {
      const combatState = world.getComponent(entity, CombatState);
      if (combatState) {
        combatState.targetId = data.targetId;
      }
    }
  });

  socket.on('USE_ABILITY', (data: { abilityId: string, targetId: string | null }) => {
    const entity = playerEntities.get(socket.id);
    if (entity) {
      combatSystem.useAbility(entity, data.abilityId, data.targetId, world);
    }
  });

  socket.on('CRAFT_ITEM', (data: { recipeId: string }) => {
    const entity = playerEntities.get(socket.id);
    if (entity) {
      const success = inventorySystem.craftItem(entity, data.recipeId, world);
      if (success) {
        const inv = world.getComponent(entity, Inventory) as Inventory;
        if (inv) {
          socket.emit('INVENTORY_UPDATE', { items: inv.items });
          // Update quest progress for collection quests
          const recipe = RECIPES.find(r => r.id === data.recipeId);
          if (recipe) {
            questSystem.updateProgress(entity, QuestObjectiveType.COLLECT, recipe.result.itemId, recipe.result.quantity, world);
            const qs = world.getComponent(entity, QuestState);
            if (qs) socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
          }
        }
      }
    }
  });

  socket.on('DROP_ITEM', (data: { itemId: string, quantity: number }) => {
    const entity = playerEntities.get(socket.id);
    if (entity) {
      const success = inventorySystem.removeItem(entity, data.itemId, data.quantity, world);
      if (success) {
        const inv = world.getComponent(entity, Inventory) as Inventory;
        if (inv) {
          socket.emit('INVENTORY_UPDATE', { items: inv.items });
        }
      }
    }
  });

  socket.on('USE_ITEM', (data: { itemId: string }) => {
    const entity = playerEntities.get(socket.id);
    if (entity) {
      const item = ITEMS[data.itemId];
      
      // Si c'est un équipement, on l'équipe
      if (item && item.slot) {
        const inventory = world.getComponent(entity, Inventory) as Inventory;
        if (inventory && inventorySystem.removeItem(entity, data.itemId, 1, world)) {
          const oldItemId = equipmentSystem.equipItem(entity, data.itemId, world);
          if (oldItemId) {
            inventorySystem.addItem(entity, oldItemId, 1, world);
          }
          socket.emit('INVENTORY_UPDATE', { items: inventory.items });
          socket.emit('EQUIPMENT_UPDATE', { slots: (world.getComponent(entity, Equipment) as Equipment).slots });
          socket.emit('STATS_UPDATE', { stats: world.getComponent(entity, Stats) });
        }
        return;
      }

      // Logique d'utilisation d'objet (ex: potion)
      if (data.itemId === 'potion') {
        const stats = world.getComponent(entity, Stats) as Stats;
        if (stats && stats.hp < stats.maxHp) {
          if (inventorySystem.removeItem(entity, 'potion', 1, world)) {
            stats.hp = Math.min(stats.maxHp, stats.hp + 20);
            const inv = world.getComponent(entity, Inventory) as Inventory;
            if (inv) {
              socket.emit('INVENTORY_UPDATE', { items: inv.items });
            }
          }
        }
      }
    }
  });

  socket.on('MOVE_ITEM', (data: { from: { type: string, id: any }, to: { type: string, id: any } }) => {
    const entity = playerEntities.get(socket.id);
    if (!entity) return;

    const inventory = world.getComponent(entity, Inventory) as Inventory;
    const equipment = world.getComponent(entity, Equipment) as Equipment;
    if (!inventory || !equipment) return;

    // Inventory -> Equipment
    // Inventory -> Inventory (Reorder)
    if (data.from.type === 'inventory' && data.to.type === 'inventory') {
      const fromIndex = parseInt(data.from.id);
      const toIndex = parseInt(data.to.id);
      
      if (fromIndex !== toIndex && inventory.items[fromIndex]) {
        // Simple swap or move
        const item = inventory.items[fromIndex];
        inventory.items.splice(fromIndex, 1);
        // If toIndex is beyond current length, it will just push
        inventory.items.splice(toIndex, 0, item);
        
        socket.emit('INVENTORY_UPDATE', { items: inventory.items });
      }
    }
    // Inventory -> Equipment
    else if (data.from.type === 'inventory' && data.to.type === 'equipment') {
      const index = parseInt(data.from.id);
      const slot = data.to.id as EquipmentSlot;
      const invItem = inventory.items[index];

      if (invItem) {
        const itemDef = ITEMS[invItem.itemId];
        if (itemDef && itemDef.slot === slot) {
          if (inventorySystem.removeItemAtIndex(entity, index, 1, world)) {
            const oldItemId = equipmentSystem.equipItem(entity, invItem.itemId, world);
            if (oldItemId) {
              inventorySystem.addItem(entity, oldItemId, 1, world);
            }
            socket.emit('INVENTORY_UPDATE', { items: inventory.items });
            socket.emit('EQUIPMENT_UPDATE', { slots: equipment.slots });
            socket.emit('STATS_UPDATE', { stats: world.getComponent(entity, Stats) });
          }
        }
      }
    }
    // Equipment -> Inventory
    else if (data.from.type === 'equipment' && data.to.type === 'inventory') {
      const slot = data.from.id as EquipmentSlot;
      const itemId = equipment.slots[slot];

      if (itemId) {
        // Vérifier si l'inventaire a de la place
        if (inventory.items.length < inventory.maxSize) {
          const unequippedId = equipmentSystem.unequipItem(entity, slot, world);
          if (unequippedId) {
            inventorySystem.addItem(entity, unequippedId, 1, world);
            socket.emit('INVENTORY_UPDATE', { items: inventory.items });
            socket.emit('EQUIPMENT_UPDATE', { slots: equipment.slots });
            socket.emit('STATS_UPDATE', { stats: world.getComponent(entity, Stats) });
          }
        }
      }
    }
  });

  socket.on('INTERACT', (data: { targetId: string }) => {
    const entity = playerEntities.get(socket.id);
    if (!entity) return;

    const targetNpc = world.getComponent(data.targetId, NPC);
    if (targetNpc) {
      console.log(`Player ${entity} interacting with NPC ${targetNpc.name}`);
      
      if (targetNpc.npcType === NPCType.QUEST_GIVER) {
        // Check if player has the quest
        const qs = world.getComponent(entity, QuestState);
        if (qs) {
          const activeQuest = qs.activeQuests.find(q => q.id === woodQuest.id);
          if (activeQuest) {
            if (activeQuest.status === QuestStatus.COMPLETED) {
              // Complete quest
              if (questSystem.completeQuest(entity, woodQuest.id, world)) {
                socket.emit('QUEST_COMPLETED', { questId: woodQuest.id });
                socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
                // Sync inventory because of rewards
                const inv = world.getComponent(entity, Inventory) as Inventory;
                if (inv) socket.emit('INVENTORY_UPDATE', { items: inv.items });
              }
            } else {
              socket.emit('NPC_DIALOGUE', { name: targetNpc.name, text: "Comment avance votre quête ?" });
            }
          } else if (!qs.completedQuestIds.includes(woodQuest.id)) {
            // Offer quest
            socket.emit('QUEST_OFFERED', woodQuest);
          } else {
            socket.emit('NPC_DIALOGUE', { name: targetNpc.name, text: "Merci encore pour votre aide !" });
          }
        }
      } else if (targetNpc.npcType === NPCType.MERCHANT) {
        socket.emit('NPC_DIALOGUE', { name: targetNpc.name, text: "Voulez-vous commercer ?" });
      }
    }
  });

  socket.on('QUEST_ACCEPTED', (data: { questId: string }) => {
    const entity = playerEntities.get(socket.id);
    if (entity && data.questId === woodQuest.id) {
      if (questSystem.acceptQuest(entity, woodQuest, world)) {
        const qs = world.getComponent(entity, QuestState);
        if (qs) {
          socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
          
          // Check if player already has the items
          const inv = world.getComponent(entity, Inventory) as Inventory;
          if (inv) {
            const woodItem = inv.items.find(i => i.itemId === 'wood');
            if (woodItem) {
              questSystem.updateProgress(entity, QuestObjectiveType.COLLECT, 'wood', woodItem.quantity, world);
              socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
            }
          }
        }
      }
    }
  });

  socket.on(CHAT_MESSAGE, (data: { text: string }) => {
    const entityId = playerEntities.get(socket.id);
    if (entityId) {
      const identity = world.getComponent(entityId, Identity) as Identity;
      const message: ChatMessage = {
        sender: identity ? identity.fullName : entityId,
        text: data.text
      };
      io.emit(CHAT_MESSAGE, message);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (0.0.0.0)`);
});

// Game loop
let lastTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  world.update(dt);

  // Gérer les actions de combat basées sur l'Input
  for (const [socketId, entityId] of playerEntities.entries()) {
    const input = world.getComponent(entityId, Input);
    const combatState = world.getComponent(entityId, CombatState);
    const equipment = world.getComponent(entityId, Equipment);

    if (input && combatState) {
      // Blocage
      combatState.isBlocking = input.state.block && equipment?.slots[EquipmentSlot.OFF_HAND] === 'shield';

      // Attaque
      if (input.state.attack && equipment?.slots[EquipmentSlot.MAIN_HAND] === 'sword') {
        if (combatState.targetId) {
          combatSystem.useAbility(entityId, 'melee_attack', combatState.targetId, world);
        }
      }
    }
  }

  // Prepare world state
  const allEntities = world.getEntitiesWith(Position, Renderable);
  const worldState = allEntities.map(entity => {
    const pos = world.getComponent(entity, Position) as Position;
    const renderable = world.getComponent(entity, Renderable) as Renderable;
    const stats = world.getComponent(entity, Stats) as Stats;
    const npc = world.getComponent(entity, NPC) as NPC;
    const identity = world.getComponent(entity, Identity) as Identity;
    const equipment = world.getComponent(entity, Equipment) as Equipment;
    return {
      id: entity,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      rotationY: pos.rotationY,
      pitch: pos.pitch,
      type: renderable.type,
      color: renderable.color,
      hp: stats?.hp,
      maxHp: stats?.maxHp,
      npcType: npc?.npcType,
      npcName: npc?.name,
      fullName: identity?.fullName,
      equipment: equipment?.slots
    };
  });

  // Broadcast player states to each client
  for (const [socketId, entity] of playerEntities.entries()) {
    const sequence = lastProcessedSequence.get(socketId) || 0;
    
    io.to(socketId).emit('SERVER_STATE', {
      sequence: sequence,
      entities: worldState
    });
  }
}, 1000 / 20);

// Basic Regeneration
setInterval(() => {
  const entities = world.getEntitiesWith(Stats);
  for (const entity of entities) {
    const stats = world.getComponent(entity, Stats) as Stats;
    if (stats && stats.hp > 0) {
      stats.hp = Math.min(stats.maxHp, stats.hp + 1);
      stats.mana = Math.min(stats.maxMana, stats.mana + 2);
      stats.stamina = Math.min(stats.stamina, stats.stamina + 5);
    }
  }
}, 2000);
