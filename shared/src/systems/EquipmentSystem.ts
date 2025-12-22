import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { Equipment } from '../components/Equipment';
import { Stats } from '../components/Stats';
import { ITEMS, EquipmentSlot, ArthurianItem, Item } from '../types/Items';
import { ARTHURIAN_WEAPONS } from '../constants/ArthurianItems';

export class EquipmentSystem extends System {
    constructor() {
        super();
    }

    public update(dt: number, world: World): void {
        // Pas de logique de mise à jour continue nécessaire pour l'instant
    }

    private getItem(itemId: string): ArthurianItem | Item | undefined {
        return ARTHURIAN_WEAPONS[itemId] || ITEMS[itemId];
    }

    public equipItem(entityId: string, itemId: string, world: World): string | null {
        const equipment = world.getComponent(entityId, Equipment) as Equipment;
        const item = this.getItem(itemId);

        if (!equipment || !item || !item.slot) return null;

        const slot = item.slot as EquipmentSlot;

        // Récupérer l'ancien item si nécessaire
        const oldItemId = equipment.slots[slot];
        
        // Équiper le nouvel item
        equipment.slots[slot] = itemId;

        this.refreshStats(entityId, world);
        return oldItemId;
    }

    public unequipItem(entityId: string, slot: EquipmentSlot, world: World): string | null {
        const equipment = world.getComponent(entityId, Equipment) as Equipment;
        if (!equipment) return null;

        const itemId = equipment.slots[slot];
        equipment.slots[slot] = null;

        this.refreshStats(entityId, world);
        return itemId;
    }

    public refreshStats(entityId: string, world: World): void {
        const stats = world.getComponent(entityId, Stats) as Stats;
        const equipment = world.getComponent(entityId, Equipment) as Equipment;

        if (!stats || !equipment) return;

        // Réinitialiser aux stats de base
        stats.maxHp = 100;
        stats.attackPower = 5;
        stats.defense = 0;
        stats.maxMana = 100;
        stats.maxStamina = 100;
        stats.moveSpeed = 5;
        
        // Stats Arthuriennes de base
        stats.strength = 10;
        stats.dexterity = 10;
        stats.wisdom = 10;
        stats.faith = 10;
        stats.luck = 10;

        // Appliquer les bonus de chaque item équipé
        for (const slotKey in equipment.slots) {
            const slot = slotKey as EquipmentSlot;
            const itemId = equipment.slots[slot];
            if (itemId) {
                const item = this.getItem(itemId);
                if (item && item.stats) {
                    if (item.stats.maxHp) stats.maxHp += item.stats.maxHp;
                    if (item.stats.attackPower) stats.attackPower += item.stats.attackPower;
                    if (item.stats.defense) stats.defense += item.stats.defense;
                    if (item.stats.maxMana) stats.maxMana += item.stats.maxMana;
                    if (item.stats.stamina) stats.maxStamina += item.stats.stamina;
                    if (item.stats.moveSpeed) stats.moveSpeed += item.stats.moveSpeed;
                    
                    // Stats Arthuriennes
                    if (item.stats.strength) stats.strength += item.stats.strength;
                    if (item.stats.dexterity) stats.dexterity += item.stats.dexterity;
                    if (item.stats.wisdom) stats.wisdom += item.stats.wisdom;
                    if (item.stats.faith) stats.faith += item.stats.faith;
                    if (item.stats.luck) stats.luck += item.stats.luck;
                }
            }
        }

        // S'assurer que les HP actuels ne dépassent pas le max
        stats.hp = Math.min(stats.hp, stats.maxHp);
        stats.mana = Math.min(stats.mana, stats.maxMana);
        stats.stamina = Math.min(stats.stamina, stats.maxStamina);
    }
}
