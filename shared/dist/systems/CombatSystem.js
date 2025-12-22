import { System } from '../ecs/System';
import { CombatState } from '../components/CombatState';
import { Stats } from '../components/Stats';
import { ABILITIES, AbilityType } from '../types/Abilities';
export class CombatSystem extends System {
    onCombatEvent = null;
    constructor(onCombatEvent = null) {
        super();
        this.onCombatEvent = onCombatEvent;
    }
    update(dt, world) {
        const entities = world.getEntitiesWith(CombatState, Stats);
        for (const entity of entities) {
            const combatState = world.getComponent(entity, CombatState);
            // Mise à jour des cooldowns
            for (const [abilityId, cooldown] of combatState.cooldowns.entries()) {
                if (cooldown > 0) {
                    combatState.cooldowns.set(abilityId, Math.max(0, cooldown - dt));
                }
            }
            // Mise à jour de l'incantation
            if (combatState.casting) {
                combatState.casting.remainingTime -= dt;
                if (combatState.casting.remainingTime <= 0) {
                    this.executeAbility(entity, combatState.casting.abilityId, combatState.casting.targetId, world);
                    combatState.casting = null;
                }
            }
        }
    }
    useAbility(entityId, abilityId, targetId, world) {
        const combatState = world.getComponent(entityId, CombatState);
        const stats = world.getComponent(entityId, Stats);
        const ability = ABILITIES[abilityId];
        if (!combatState || !stats || !ability)
            return false;
        // Vérifier le cooldown
        const currentCooldown = combatState.cooldowns.get(abilityId) || 0;
        if (currentCooldown > 0)
            return false;
        // Vérifier si déjà en train d'incanter
        if (combatState.casting)
            return false;
        // Vérifier les ressources
        if (stats.mana < ability.manaCost || stats.stamina < ability.staminaCost)
            return false;
        // Consommer les ressources
        stats.mana -= ability.manaCost;
        stats.stamina -= ability.staminaCost;
        if (ability.castTime > 0) {
            combatState.casting = {
                abilityId,
                remainingTime: ability.castTime,
                totalTime: ability.castTime,
                targetId
            };
        }
        else {
            this.executeAbility(entityId, abilityId, targetId, world);
        }
        // Appliquer le cooldown
        combatState.cooldowns.set(abilityId, ability.cooldown);
        if (ability.id === 'melee_attack') {
            combatState.lastAttackTime = Date.now();
        }
        return true;
    }
    executeAbility(sourceId, abilityId, targetId, world) {
        const ability = ABILITIES[abilityId];
        if (!ability)
            return;
        // Pour les soins, si pas de cible, on se soigne soi-même
        const effectiveTargetId = (ability.type === AbilityType.HEAL && !targetId) ? sourceId : targetId;
        if (!effectiveTargetId)
            return;
        const targetStats = world.getComponent(effectiveTargetId, Stats);
        if (!targetStats)
            return;
        if (ability.type === AbilityType.HEAL) {
            const healAmount = ability.power;
            targetStats.hp = Math.min(targetStats.maxHp, targetStats.hp + healAmount);
            if (this.onCombatEvent) {
                this.onCombatEvent({
                    type: 'heal',
                    sourceId,
                    targetId: effectiveTargetId,
                    abilityId,
                    value: healAmount
                });
            }
        }
        else {
            let damageAmount = ability.power;
            // Vérifier si la cible bloque
            const targetCombatState = world.getComponent(effectiveTargetId, CombatState);
            if (targetCombatState && targetCombatState.isBlocking) {
                const blockAbility = ABILITIES['block'];
                damageAmount *= blockAbility.power; // Réduction des dégâts
            }
            targetStats.hp = Math.max(0, targetStats.hp - damageAmount);
            if (this.onCombatEvent) {
                this.onCombatEvent({
                    type: 'damage',
                    sourceId,
                    targetId: effectiveTargetId,
                    abilityId,
                    value: damageAmount
                });
            }
            if (targetStats.hp <= 0) {
                if (this.onCombatEvent) {
                    this.onCombatEvent({
                        type: 'death',
                        sourceId,
                        targetId: effectiveTargetId,
                        abilityId,
                        value: 0
                    });
                }
                // La destruction de l'entité sera gérée par le serveur suite à l'événement
            }
        }
    }
}
//# sourceMappingURL=CombatSystem.js.map