"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISystem = void 0;
const System_1 = require("../../../shared/src/ecs/System");
const Position_1 = require("../../../shared/src/components/Position");
const Velocity_1 = require("../../../shared/src/components/Velocity");
const NPC_1 = require("../../../shared/src/components/NPC");
const Input_1 = require("../../../shared/src/components/Input");
const CombatState_1 = require("../../../shared/src/components/CombatState");
class AISystem extends System_1.System {
    DETECTION_RANGE = 10;
    ATTACK_RANGE = 2;
    MOVE_SPEED = 3;
    update(dt, world) {
        const npcs = world.getEntitiesWith(NPC_1.NPC, Position_1.Position, Velocity_1.Velocity);
        const players = world.getEntitiesWith(Input_1.Input, Position_1.Position);
        for (const npcEntity of npcs) {
            const npc = world.getComponent(npcEntity, NPC_1.NPC);
            const pos = world.getComponent(npcEntity, Position_1.Position);
            const vel = world.getComponent(npcEntity, Velocity_1.Velocity);
            if (npc.npcType === NPC_1.NPCType.ENEMY) {
                this.updateEnemyAI(npcEntity, pos, vel, players, world);
            }
            else {
                // Optionnel: mouvement aléatoire pour les PNJs non-ennemis
                this.updatePassiveAI(vel);
            }
        }
    }
    updateEnemyAI(entity, pos, vel, players, world) {
        let closestPlayer = null;
        let minDistance = this.DETECTION_RANGE;
        for (const playerEntity of players) {
            const playerPos = world.getComponent(playerEntity, Position_1.Position);
            const dx = playerPos.x - pos.x;
            const dz = playerPos.z - pos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance < minDistance) {
                minDistance = distance;
                closestPlayer = playerEntity;
            }
        }
        if (closestPlayer) {
            const playerPos = world.getComponent(closestPlayer, Position_1.Position);
            const dx = playerPos.x - pos.x;
            const dz = playerPos.z - pos.z;
            if (minDistance > this.ATTACK_RANGE) {
                // Move towards player
                const length = Math.sqrt(dx * dx + dz * dz);
                vel.vx = (dx / length) * this.MOVE_SPEED;
                vel.vz = (dz / length) * this.MOVE_SPEED;
                pos.rotationY = Math.atan2(-dx, -dz);
            }
            else {
                // Attack player
                vel.vx = 0;
                vel.vz = 0;
                let combatState = world.getComponent(entity, CombatState_1.CombatState);
                if (!combatState) {
                    combatState = new CombatState_1.CombatState();
                    world.addComponent(entity, combatState);
                }
                combatState.targetId = closestPlayer;
            }
        }
        else {
            vel.vx = 0;
            vel.vz = 0;
        }
    }
    updatePassiveAI(vel) {
        // Simple wandering could be added here
        // For now, just stay still or keep current velocity if we want them to move
    }
}
exports.AISystem = AISystem;
//# sourceMappingURL=AISystem.js.map