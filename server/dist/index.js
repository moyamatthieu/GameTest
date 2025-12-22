"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const shared_1 = require("shared");
const AISystem_1 = require("./game/AISystem");
const QuestSystem_1 = require("./game/QuestSystem");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
    }
});
const world = new shared_1.World();
const movementSystem = new shared_1.MovementSystem();
const inventorySystem = new shared_1.InventorySystem();
const equipmentSystem = new shared_1.EquipmentSystem();
const aiSystem = new AISystem_1.AISystem();
const questSystem = new QuestSystem_1.QuestSystem(inventorySystem);
// Sample Quest
const woodQuest = {
    id: 'wood_quest',
    title: 'Collecter du bois',
    description: 'Apportez 5 unités de bois au garde.',
    objectives: [
        {
            type: shared_1.QuestObjectiveType.COLLECT,
            targetId: 'wood',
            requiredAmount: 5,
            currentAmount: 0,
            description: 'Bois collecté'
        }
    ],
    rewards: {
        items: [{ itemId: 'iron', amount: 2 }]
    },
    status: shared_1.QuestStatus.AVAILABLE
};
const combatSystem = new shared_1.CombatSystem((event) => {
    io.emit('COMBAT_LOG', event);
    if (event.type === 'death') {
        io.emit('ENTITY_DIED', { entityId: event.targetId });
        console.log(`Entity ${event.targetId} died!`);
        // Update quest progress for all players if the target was an enemy
        const targetNpc = world.getComponent(event.targetId, shared_1.NPC);
        if (targetNpc && targetNpc.npcType === shared_1.NPCType.ENEMY) {
            for (const playerEntity of playerEntities.values()) {
                questSystem.updateProgress(playerEntity, shared_1.QuestObjectiveType.KILL, 'enemy', 1, world);
                // Sync quest state
                const qs = world.getComponent(playerEntity, shared_1.QuestState);
                const socketId = Array.from(playerEntities.entries()).find(([_, id]) => id === playerEntity)?.[0];
                if (qs && socketId) {
                    io.to(socketId).emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
                }
            }
        }
        // Simple respawn logic
        const stats = world.getComponent(event.targetId, shared_1.Stats);
        const pos = world.getComponent(event.targetId, shared_1.Position);
        if (stats && pos) {
            stats.hp = stats.maxHp;
            pos.x = 0;
            pos.z = 0;
        }
    }
});
world.addSystem(movementSystem);
world.addSystem(aiSystem);
world.addSystem(combatSystem);
world.addSystem(inventorySystem);
// Create a Quest Giver NPC
const questGiver = world.createEntity();
world.addComponent(questGiver, new shared_1.Position(5, 0, 5));
world.addComponent(questGiver, new shared_1.Velocity());
world.addComponent(questGiver, new shared_1.NPC('Garde Forestier', shared_1.NPCType.QUEST_GIVER));
world.addComponent(questGiver, new shared_1.Renderable(shared_1.RenderType.PLAYER, 0x0000ff)); // Blue for NPC
world.addComponent(questGiver, new shared_1.Stats(1000, 1000));
// Create some Enemies
for (let i = 0; i < 3; i++) {
    const enemy = world.createEntity();
    world.addComponent(enemy, new shared_1.Position(Math.random() * 20 - 10, 0, Math.random() * 20 - 10));
    world.addComponent(enemy, new shared_1.Velocity());
    world.addComponent(enemy, new shared_1.NPC(`Loup ${i + 1}`, shared_1.NPCType.ENEMY));
    world.addComponent(enemy, new shared_1.Renderable(shared_1.RenderType.PLAYER, 0xff0000)); // Red for Enemy
    world.addComponent(enemy, new shared_1.Stats(50, 50));
    world.addComponent(enemy, new shared_1.CombatState());
}
// Map pour stocker les entités par socket
const playerEntities = new Map();
// Map pour stocker le dernier numéro de séquence traité par joueur
const lastProcessedSequence = new Map();
const accounts = new Map();
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
    world.addComponent(playerEntity, new shared_1.Position());
    world.addComponent(playerEntity, new shared_1.Velocity());
    world.addComponent(playerEntity, new shared_1.Input());
    world.addComponent(playerEntity, new shared_1.Stats());
    world.addComponent(playerEntity, new shared_1.CombatState());
    world.addComponent(playerEntity, new shared_1.Inventory());
    world.addComponent(playerEntity, new shared_1.Equipment());
    world.addComponent(playerEntity, new shared_1.QuestState());
    world.addComponent(playerEntity, new shared_1.Renderable(shared_1.RenderType.PLAYER, 0x00ff00));
    // Ajout de l'identité
    const firstName = `Perso${characterIndex}`;
    world.addComponent(playerEntity, new shared_1.Identity(firstName, account.lastName));
    // Add some starting items for testing
    inventorySystem.addItem(playerEntity, 'wood', 5, world);
    inventorySystem.addItem(playerEntity, 'iron', 2, world);
    inventorySystem.addItem(playerEntity, 'sword', 1, world);
    inventorySystem.addItem(playerEntity, 'shield', 1, world);
    console.log(`Created entity ${playerEntity} for player ${socket.id}`);
    socket.emit('WELCOME', { entityId: playerEntity });
    // Initial inventory sync
    const inv = world.getComponent(playerEntity, shared_1.Inventory);
    if (inv) {
        socket.emit('INVENTORY_UPDATE', { items: inv.items });
    }
    // Initial equipment sync
    const eq = world.getComponent(playerEntity, shared_1.Equipment);
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
    socket.on('PLAYER_INPUT', (data) => {
        const entity = playerEntities.get(socket.id);
        if (entity) {
            const input = world.getComponent(entity, shared_1.Input);
            if (input) {
                input.state = data.state;
                input.sequence = data.sequence;
                lastProcessedSequence.set(socket.id, data.sequence);
            }
        }
    });
    socket.on('TARGET_CHANGED', (data) => {
        const entity = playerEntities.get(socket.id);
        if (entity) {
            const combatState = world.getComponent(entity, shared_1.CombatState);
            if (combatState) {
                combatState.targetId = data.targetId;
            }
        }
    });
    socket.on('USE_ABILITY', (data) => {
        const entity = playerEntities.get(socket.id);
        if (entity) {
            combatSystem.useAbility(entity, data.abilityId, data.targetId, world);
        }
    });
    socket.on('CRAFT_ITEM', (data) => {
        const entity = playerEntities.get(socket.id);
        if (entity) {
            const success = inventorySystem.craftItem(entity, data.recipeId, world);
            if (success) {
                const inv = world.getComponent(entity, shared_1.Inventory);
                if (inv) {
                    socket.emit('INVENTORY_UPDATE', { items: inv.items });
                    // Update quest progress for collection quests
                    const recipe = shared_1.RECIPES.find(r => r.id === data.recipeId);
                    if (recipe) {
                        questSystem.updateProgress(entity, shared_1.QuestObjectiveType.COLLECT, recipe.result.itemId, recipe.result.quantity, world);
                        const qs = world.getComponent(entity, shared_1.QuestState);
                        if (qs)
                            socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
                    }
                }
            }
        }
    });
    socket.on('DROP_ITEM', (data) => {
        const entity = playerEntities.get(socket.id);
        if (entity) {
            const success = inventorySystem.removeItem(entity, data.itemId, data.quantity, world);
            if (success) {
                const inv = world.getComponent(entity, shared_1.Inventory);
                if (inv) {
                    socket.emit('INVENTORY_UPDATE', { items: inv.items });
                }
            }
        }
    });
    socket.on('USE_ITEM', (data) => {
        const entity = playerEntities.get(socket.id);
        if (entity) {
            const item = shared_1.ITEMS[data.itemId];
            // Si c'est un équipement, on l'équipe
            if (item && item.slot) {
                const inventory = world.getComponent(entity, shared_1.Inventory);
                if (inventory && inventorySystem.removeItem(entity, data.itemId, 1, world)) {
                    const oldItemId = equipmentSystem.equipItem(entity, data.itemId, world);
                    if (oldItemId) {
                        inventorySystem.addItem(entity, oldItemId, 1, world);
                    }
                    socket.emit('INVENTORY_UPDATE', { items: inventory.items });
                    socket.emit('EQUIPMENT_UPDATE', { slots: world.getComponent(entity, shared_1.Equipment).slots });
                    socket.emit('STATS_UPDATE', { stats: world.getComponent(entity, shared_1.Stats) });
                }
                return;
            }
            // Logique d'utilisation d'objet (ex: potion)
            if (data.itemId === 'potion') {
                const stats = world.getComponent(entity, shared_1.Stats);
                if (stats && stats.hp < stats.maxHp) {
                    if (inventorySystem.removeItem(entity, 'potion', 1, world)) {
                        stats.hp = Math.min(stats.maxHp, stats.hp + 20);
                        const inv = world.getComponent(entity, shared_1.Inventory);
                        if (inv) {
                            socket.emit('INVENTORY_UPDATE', { items: inv.items });
                        }
                    }
                }
            }
        }
    });
    socket.on('MOVE_ITEM', (data) => {
        const entity = playerEntities.get(socket.id);
        if (!entity)
            return;
        const inventory = world.getComponent(entity, shared_1.Inventory);
        const equipment = world.getComponent(entity, shared_1.Equipment);
        if (!inventory || !equipment)
            return;
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
            const slot = data.to.id;
            const invItem = inventory.items[index];
            if (invItem) {
                const itemDef = shared_1.ITEMS[invItem.itemId];
                if (itemDef && itemDef.slot === slot) {
                    if (inventorySystem.removeItemAtIndex(entity, index, 1, world)) {
                        const oldItemId = equipmentSystem.equipItem(entity, invItem.itemId, world);
                        if (oldItemId) {
                            inventorySystem.addItem(entity, oldItemId, 1, world);
                        }
                        socket.emit('INVENTORY_UPDATE', { items: inventory.items });
                        socket.emit('EQUIPMENT_UPDATE', { slots: equipment.slots });
                        socket.emit('STATS_UPDATE', { stats: world.getComponent(entity, shared_1.Stats) });
                    }
                }
            }
        }
        // Equipment -> Inventory
        else if (data.from.type === 'equipment' && data.to.type === 'inventory') {
            const slot = data.from.id;
            const itemId = equipment.slots[slot];
            if (itemId) {
                // Vérifier si l'inventaire a de la place
                if (inventory.items.length < inventory.maxSize) {
                    const unequippedId = equipmentSystem.unequipItem(entity, slot, world);
                    if (unequippedId) {
                        inventorySystem.addItem(entity, unequippedId, 1, world);
                        socket.emit('INVENTORY_UPDATE', { items: inventory.items });
                        socket.emit('EQUIPMENT_UPDATE', { slots: equipment.slots });
                        socket.emit('STATS_UPDATE', { stats: world.getComponent(entity, shared_1.Stats) });
                    }
                }
            }
        }
    });
    socket.on('INTERACT', (data) => {
        const entity = playerEntities.get(socket.id);
        if (!entity)
            return;
        const targetNpc = world.getComponent(data.targetId, shared_1.NPC);
        if (targetNpc) {
            console.log(`Player ${entity} interacting with NPC ${targetNpc.name}`);
            if (targetNpc.npcType === shared_1.NPCType.QUEST_GIVER) {
                // Check if player has the quest
                const qs = world.getComponent(entity, shared_1.QuestState);
                if (qs) {
                    const activeQuest = qs.activeQuests.find(q => q.id === woodQuest.id);
                    if (activeQuest) {
                        if (activeQuest.status === shared_1.QuestStatus.COMPLETED) {
                            // Complete quest
                            if (questSystem.completeQuest(entity, woodQuest.id, world)) {
                                socket.emit('QUEST_COMPLETED', { questId: woodQuest.id });
                                socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
                                // Sync inventory because of rewards
                                const inv = world.getComponent(entity, shared_1.Inventory);
                                if (inv)
                                    socket.emit('INVENTORY_UPDATE', { items: inv.items });
                            }
                        }
                        else {
                            socket.emit('NPC_DIALOGUE', { name: targetNpc.name, text: "Comment avance votre quête ?" });
                        }
                    }
                    else if (!qs.completedQuestIds.includes(woodQuest.id)) {
                        // Offer quest
                        socket.emit('QUEST_OFFERED', woodQuest);
                    }
                    else {
                        socket.emit('NPC_DIALOGUE', { name: targetNpc.name, text: "Merci encore pour votre aide !" });
                    }
                }
            }
            else if (targetNpc.npcType === shared_1.NPCType.MERCHANT) {
                socket.emit('NPC_DIALOGUE', { name: targetNpc.name, text: "Voulez-vous commercer ?" });
            }
        }
    });
    socket.on('QUEST_ACCEPTED', (data) => {
        const entity = playerEntities.get(socket.id);
        if (entity && data.questId === woodQuest.id) {
            if (questSystem.acceptQuest(entity, woodQuest, world)) {
                const qs = world.getComponent(entity, shared_1.QuestState);
                if (qs) {
                    socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
                    // Check if player already has the items
                    const inv = world.getComponent(entity, shared_1.Inventory);
                    if (inv) {
                        const woodItem = inv.items.find(i => i.itemId === 'wood');
                        if (woodItem) {
                            questSystem.updateProgress(entity, shared_1.QuestObjectiveType.COLLECT, 'wood', woodItem.quantity, world);
                            socket.emit('QUEST_UPDATE', { activeQuests: qs.activeQuests, completedQuestIds: qs.completedQuestIds });
                        }
                    }
                }
            }
        }
    });
    socket.on(shared_1.CHAT_MESSAGE, (data) => {
        const entityId = playerEntities.get(socket.id);
        if (entityId) {
            const identity = world.getComponent(entityId, shared_1.Identity);
            const message = {
                sender: identity ? identity.fullName : entityId,
                text: data.text
            };
            io.emit(shared_1.CHAT_MESSAGE, message);
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
        const input = world.getComponent(entityId, shared_1.Input);
        const combatState = world.getComponent(entityId, shared_1.CombatState);
        const equipment = world.getComponent(entityId, shared_1.Equipment);
        if (input && combatState) {
            // Blocage
            combatState.isBlocking = input.state.block && equipment?.slots[shared_1.EquipmentSlot.OFF_HAND] === 'shield';
            // Attaque
            if (input.state.attack && equipment?.slots[shared_1.EquipmentSlot.MAIN_HAND] === 'sword') {
                if (combatState.targetId) {
                    combatSystem.useAbility(entityId, 'melee_attack', combatState.targetId, world);
                }
            }
        }
    }
    // Prepare world state
    const allEntities = world.getEntitiesWith(shared_1.Position, shared_1.Renderable);
    const worldState = allEntities.map(entity => {
        const pos = world.getComponent(entity, shared_1.Position);
        const renderable = world.getComponent(entity, shared_1.Renderable);
        const stats = world.getComponent(entity, shared_1.Stats);
        const npc = world.getComponent(entity, shared_1.NPC);
        const identity = world.getComponent(entity, shared_1.Identity);
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
            fullName: identity?.fullName
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
    const entities = world.getEntitiesWith(shared_1.Stats);
    for (const entity of entities) {
        const stats = world.getComponent(entity, shared_1.Stats);
        if (stats && stats.hp > 0) {
            stats.hp = Math.min(stats.maxHp, stats.hp + 1);
            stats.mana = Math.min(stats.maxMana, stats.mana + 2);
            stats.stamina = Math.min(stats.stamina, stats.stamina + 5);
        }
    }
}, 2000);
//# sourceMappingURL=index.js.map