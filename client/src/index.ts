import * as THREE from 'three';
import { io } from 'socket.io-client';
import { 
  World, Position, Velocity, Input, MovementSystem, InputState, 
  Renderable, RenderType, CombatState, CombatSystem, ABILITIES, Stats,
  Inventory, InventoryItem, NPC, NPCType, QuestState, QuestStatus, Quest,
  CHAT_MESSAGE, ChatMessage, Identity, Equipment, CombatEvent
} from 'shared';
import { InputHandler } from './engine/InputHandler';
import { RenderSystem } from './engine/RenderSystem';
import { EnvironmentSystem } from './engine/EnvironmentSystem';
import { EquipmentVisualSystem } from './engine/EquipmentVisualSystem';
import { GameMap } from './engine/Map';
import { UIManager } from './ui/UIManager';

// Setup Three.js
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Map
const gameMap = new GameMap(scene);

// Setup ECS
const world = new World();
const movementSystem = new MovementSystem();
const equipmentVisualSystem = new EquipmentVisualSystem();
const renderSystem = new RenderSystem(scene, camera, equipmentVisualSystem);
const environmentSystem = new EnvironmentSystem(scene);
const combatSystem = new CombatSystem();

world.addSystem(movementSystem);
world.addSystem(renderSystem);
world.addSystem(environmentSystem);
world.addSystem(equipmentVisualSystem);
world.addSystem(combatSystem);

// Local Player State
let playerEntity: string | null = null;
let playerCombatState: CombatState | null = null;
const inputHandler = new InputHandler();
let sequenceNumber = 0;
const pendingInputs: { sequence: number; state: InputState; dt: number }[] = [];

// Setup Network
const socket = io(); // Se connecte à l'hôte actuel (Vite proxy s'occupe du reste)
const uiManager = new UIManager(world, socket, inputHandler);

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('WELCOME', (data: { entityId: string }) => {
  playerEntity = data.entityId;
  renderSystem.setLocalPlayer(playerEntity);
  playerCombatState = new CombatState();
  world.addComponent(playerEntity, playerCombatState);
  world.addComponent(playerEntity, new Input());
  world.addComponent(playerEntity, new Velocity());
  console.log('My entity ID is:', playerEntity);
});

socket.on('COMBAT_LOG', (event: CombatEvent) => {
  const targetPos = world.getComponent(event.targetId, Position) as Position;
  if (targetPos) {
    let color = '#ff0000';
    let text = '';
    
    if (event.type === 'damage') {
      color = '#ff0000';
      text = `-${Math.round(event.value)}`;
    } else if (event.type === 'heal') {
      color = '#00ff00';
      text = `+${Math.round(event.value)}`;
    } else if (event.type === 'death') {
      color = '#ffffff';
      text = 'MORT';
    }
    
    if (text) {
      renderSystem.addFloatingText(text, new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), color);
    }
  }
});

socket.on('SERVER_STATE', (data: { sequence: number; entities: any[] }) => {
  if (!playerEntity) return;

  const remoteEntityIds = new Set(data.entities.map(e => e.id));
  
  // Remove entities that no longer exist
  const currentEntities = world.getEntitiesWith(Position);
  for (const entityId of currentEntities) {
    if (!remoteEntityIds.has(entityId) && entityId !== playerEntity) {
      world.destroyEntity(entityId);
    }
  }

  for (const entityData of data.entities) {
    let pos = world.getComponent(entityData.id, Position) as Position;
    let renderable = world.getComponent(entityData.id, Renderable) as Renderable;
    let stats = world.getComponent(entityData.id, Stats) as Stats;
    let npc = world.getComponent(entityData.id, NPC) as NPC;
    let identity = world.getComponent(entityData.id, Identity) as Identity;
    let equipment = world.getComponent(entityData.id, Equipment) as Equipment;

    if (!pos) {
      pos = new Position();
      world.addComponent(entityData.id, pos);
    }
    if (!renderable) {
      renderable = new Renderable(entityData.type, entityData.color);
      world.addComponent(entityData.id, renderable);
    }
    if (!stats) {
      stats = new Stats();
      world.addComponent(entityData.id, stats);
    }
    if (entityData.npcType && !npc) {
      npc = new NPC(entityData.npcName, entityData.npcType);
      world.addComponent(entityData.id, npc);
    }
    if (entityData.fullName && !identity) {
      const names = entityData.fullName.split(' ');
      identity = new Identity(names[0], names.slice(1).join(' '));
      world.addComponent(entityData.id, identity);
    }
    if (entityData.equipment) {
      if (!equipment) {
        equipment = new Equipment();
        world.addComponent(entityData.id, equipment);
      }
      equipment.slots = entityData.equipment;
    }

    if (entityData.id === playerEntity) {
      // Mise à jour des statistiques du joueur local dans l'UI
      uiManager.updatePlayerStats(stats);

      // --- RÉCONCILIATION SERVEUR ---
      // 1. On remplace la position locale par la position officielle du serveur
      pos.x = entityData.x;
      pos.y = entityData.y;
      pos.z = entityData.z;
      pos.rotationY = entityData.rotationY;
      pos.pitch = entityData.pitch;

      // 2. On supprime de la liste des entrées en attente celles qui ont été traitées par le serveur
      const index = pendingInputs.findIndex(i => i.sequence === data.sequence);
      if (index !== -1) {
        pendingInputs.splice(0, index + 1);
      }

      // 3. On "rejoue" toutes les entrées qui n'ont pas encore été confirmées par le serveur
      // Cela permet d'éviter que le joueur ne soit téléporté en arrière à chaque mise à jour serveur
      for (const input of pendingInputs) {
        const playerInput = world.getComponent(playerEntity, Input);
        if (playerInput) {
          playerInput.state = input.state;
          movementSystem.update(input.dt, world);
        }
      }
    } else {
      // Simple interpolation/snap for others
      pos.x = entityData.x;
      pos.y = entityData.y;
      pos.z = entityData.z;
      pos.rotationY = entityData.rotationY;
      pos.pitch = entityData.pitch;
    }
    
    stats.hp = entityData.hp;
    stats.maxHp = entityData.maxHp;

    // Update target UI if this is our target
    if (playerCombatState && playerCombatState.targetId === entityData.id) {
      uiManager.updateTarget(entityData.id);
    }
  }
});

socket.on('COMBAT_LOG', (data: { type: string, sourceId: string, targetId: string, abilityId: string, value: number }) => {
  console.log(`Combat: ${data.sourceId} used ${data.abilityId} on ${data.targetId} for ${data.value} (${data.type})`);
  const type = data.type === 'damage' ? 'damage' : (data.type === 'heal' ? 'heal' : 'info');
  uiManager.addCombatLog(`${data.abilityId}: ${data.value}`, type);
});

socket.on('ENTITY_DIED', (data: { entityId: string }) => {
  console.log(`Entity died: ${data.entityId}`);
  uiManager.addCombatLog(`Entité morte: ${data.entityId}`, 'info');
  if (playerCombatState && playerCombatState.targetId === data.entityId) {
    playerCombatState.targetId = null;
    uiManager.updateTarget(null);
  }
});

socket.on('INVENTORY_UPDATE', (data: { items: InventoryItem[] }) => {
  if (playerEntity) {
    let inventory = world.getComponent(playerEntity, Inventory) as Inventory;
    if (!inventory) {
      inventory = new Inventory();
      world.addComponent(playerEntity, inventory);
    }
    inventory.items = data.items;
    uiManager.updateInventory(inventory);
  }
});

socket.on('EQUIPMENT_UPDATE', (data: { slots: any }) => {
  if (playerEntity) {
    let equipment = world.getComponent(playerEntity, Equipment) as Equipment;
    if (!equipment) {
      equipment = new Equipment();
      world.addComponent(playerEntity, equipment);
    }
    equipment.slots = data.slots;
    uiManager.updateEquipment(equipment);
  }
});

socket.on('STATS_UPDATE', (data: { stats: any }) => {
  if (playerEntity) {
    let stats = world.getComponent(playerEntity, Stats) as Stats;
    if (stats) {
      Object.assign(stats, data.stats);
      uiManager.updatePlayerStats(stats);
    }
  }
});

socket.on(CHAT_MESSAGE, (data: ChatMessage) => {
  uiManager.addChatMessage(data.sender, data.text, data.isSystem);
});

socket.on('NPC_DIALOGUE', (data: { name: string, text: string }) => {
  console.log(`[${data.name}] ${data.text}`);
  uiManager.addChatMessage(data.name, data.text);
});

socket.on('QUEST_OFFERED', (quest: Quest) => {
  console.log('Quest Offered:', quest.title);
  const accept = confirm(`Quête: ${quest.title}\n\n${quest.description}\n\nAccepter ?`);
  if (accept) {
    socket.emit('QUEST_ACCEPTED', { questId: quest.id });
  }
});

socket.on('QUEST_UPDATE', (data: { activeQuests: Quest[], completedQuestIds: string[] }) => {
  if (playerEntity) {
    let qs = world.getComponent(playerEntity, QuestState) as QuestState;
    if (!qs) {
      qs = new QuestState();
      world.addComponent(playerEntity, qs);
    }
    qs.activeQuests = data.activeQuests;
    qs.completedQuestIds = data.completedQuestIds;
  }
});

socket.on('QUEST_COMPLETED', (data: { questId: string }) => {
  console.log('Quest Completed:', data.questId);
  alert(`Quête terminée !`);
});

// Targeting Logic
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousedown', (event) => {
  // Ignore clicks on UI
  if ((event.target as HTMLElement).tagName !== 'CANVAS') return;
  
  if (!playerEntity || !playerCombatState) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const meshes = Array.from(renderSystem.meshes.values());
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    for (const [entityId, mesh] of renderSystem.meshes.entries()) {
      if (mesh === clickedMesh) {
        if (entityId !== playerEntity) {
          playerCombatState.targetId = entityId;
          socket.emit('TARGET_CHANGED', { targetId: entityId });
          uiManager.updateTarget(entityId);
        }
        break;
      }
    }
  } else {
    playerCombatState.targetId = null;
    socket.emit('TARGET_CHANGED', { targetId: null });
    uiManager.updateTarget(null);
  }
});

inputHandler.onKeyPress('Tab', () => {
  if (!playerEntity || !playerCombatState) return;

  const allEntities = world.getEntitiesWith(Renderable);
  const otherEntities = allEntities.filter(e => e !== playerEntity);
  
  if (otherEntities.length === 0) return;

  let nextIndex = 0;
  if (playerCombatState.targetId) {
    const currentIndex = otherEntities.indexOf(playerCombatState.targetId);
    nextIndex = (currentIndex + 1) % otherEntities.length;
  }

  playerCombatState.targetId = otherEntities[nextIndex];
  socket.emit('TARGET_CHANGED', { targetId: playerCombatState.targetId });
  uiManager.updateTarget(playerCombatState.targetId);
  console.log('Target changed (Tab) to:', playerCombatState.targetId);
});

// Ability Usage
inputHandler.onKeyPress('Digit1', () => useAbility('melee_attack'));
inputHandler.onKeyPress('Digit2', () => useAbility('fireball'));
inputHandler.onKeyPress('Digit3', () => useAbility('heal'));

// Inventory Actions
inputHandler.onKeyPress('KeyC', () => {
  console.log('Requesting craft: craft_sword');
  socket.emit('CRAFT_ITEM', { recipeId: 'craft_sword' });
});

inputHandler.onKeyPress('KeyP', () => {
  console.log('Requesting use: potion');
  socket.emit('USE_ITEM', { itemId: 'potion' });
});

inputHandler.onKeyPress('KeyX', () => {
  console.log('Requesting drop: wood');
  socket.emit('DROP_ITEM', { itemId: 'wood', quantity: 1 });
});

inputHandler.onKeyPress('KeyF', () => {
  if (!playerEntity) return;
  const playerPos = world.getComponent(playerEntity, Position);
  if (!playerPos) return;

  // Find nearest NPC
  const npcs = world.getEntitiesWith(NPC, Position);
  let closestNpc: string | null = null;
  let minDistance = 3; // Interaction range

  for (const npcId of npcs) {
    const npcPos = world.getComponent(npcId, Position)!;
    const dx = npcPos.x - playerPos.x;
    const dz = npcPos.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      closestNpc = npcId;
    }
  }

  if (closestNpc) {
    console.log('Interacting with NPC:', closestNpc);
    socket.emit('INTERACT', { targetId: closestNpc });
  }
});

let isFirstPerson = false;
inputHandler.onKeyPress('KeyV', () => {
  isFirstPerson = !isFirstPerson;
  renderSystem.setFirstPerson(isFirstPerson);
  console.log('Camera view changed to:', isFirstPerson ? 'First Person' : 'Third Person');
});

function useAbility(abilityId: string) {
  if (!playerCombatState) return;
  socket.emit('USE_ABILITY', {
    abilityId,
    targetId: playerCombatState.targetId
  });
}

// Game loop
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (playerEntity) {
    const playerPos = world.getComponent(playerEntity, Position);
    const playerInput = world.getComponent(playerEntity, Input);

    if (playerPos && playerInput) {
      // --- PRÉDICTION CLIENT ---
      
      // 1. Capturer les entrées clavier/souris
      const currentInputState = inputHandler.getInputState();
      sequenceNumber++;

      // 2. Stocker l'entrée pour la future réconciliation
      playerInput.state = currentInputState;
      playerInput.sequence = sequenceNumber;
      pendingInputs.push({ sequence: sequenceNumber, state: { ...currentInputState }, dt });

      // 3. Appliquer immédiatement le mouvement localement (Prédiction)
      // On n'attend pas le serveur pour bouger le personnage
      world.update(dt);

      // 4. Envoyer l'entrée au serveur avec son numéro de séquence
      socket.emit('PLAYER_INPUT', {
        sequence: sequenceNumber,
        state: currentInputState
      });
    }
  } else {
    // Still update world (for other entities) even if player not loaded
    world.update(dt);
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
