import { System } from '../ecs/System';
import { Equipment } from '../components/Equipment';
import { Stats } from '../components/Stats';
import { ITEMS } from '../types/Items';
export class EquipmentSystem extends System {
    constructor() {
        super();
    }
    update(dt, world) {
        // Pas de logique de mise à jour continue nécessaire pour l'instant
    }
    equipItem(entityId, itemId, world) {
        const equipment = world.getComponent(entityId, Equipment);
        const item = ITEMS[itemId];
        if (!equipment || !item || !item.slot)
            return null;
        // Récupérer l'ancien item si nécessaire
        const oldItemId = equipment.slots[item.slot];
        // Équiper le nouvel item
        equipment.slots[item.slot] = itemId;
        this.refreshStats(entityId, world);
        return oldItemId;
    }
    unequipItem(entityId, slot, world) {
        const equipment = world.getComponent(entityId, Equipment);
        if (!equipment)
            return null;
        const itemId = equipment.slots[slot];
        equipment.slots[slot] = null;
        this.refreshStats(entityId, world);
        return itemId;
    }
    refreshStats(entityId, world) {
        const stats = world.getComponent(entityId, Stats);
        const equipment = world.getComponent(entityId, Equipment);
        if (!stats || !equipment)
            return;
        // Réinitialiser aux stats de base (on pourrait stocker les stats de base séparément)
        // Pour cet exercice, on va assumer des stats de base fixes
        stats.maxHp = 100;
        stats.attackPower = 5;
        stats.defense = 0;
        stats.maxMana = 100;
        stats.maxStamina = 100;
        stats.moveSpeed = 5;
        // Appliquer les bonus de chaque item équipé
        for (const slot in equipment.slots) {
            const itemId = equipment.slots[slot];
            if (itemId) {
                const item = ITEMS[itemId];
                if (item && item.stats) {
                    if (item.stats.maxHp)
                        stats.maxHp += item.stats.maxHp;
                    if (item.stats.attackPower)
                        stats.attackPower += item.stats.attackPower;
                    if (item.stats.defense)
                        stats.defense += item.stats.defense;
                    if (item.stats.maxMana)
                        stats.maxMana += item.stats.maxMana;
                    if (item.stats.stamina)
                        stats.maxStamina += item.stats.stamina;
                    if (item.stats.moveSpeed)
                        stats.moveSpeed += item.stats.moveSpeed;
                }
            }
        }
        // S'assurer que les HP actuels ne dépassent pas le max
        stats.hp = Math.min(stats.hp, stats.maxHp);
        stats.mana = Math.min(stats.mana, stats.maxMana);
        stats.stamina = Math.min(stats.stamina, stats.maxStamina);
    }
}
//# sourceMappingURL=EquipmentSystem.js.map