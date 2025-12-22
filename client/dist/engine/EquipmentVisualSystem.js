import * as THREE from 'three';
import { System } from '../../../shared/src/ecs/System';
import { Equipment } from '../../../shared/src/components/Equipment';
import { ARTHURIAN_WEAPONS } from '../../../shared/src/constants/ArthurianItems';
import { ITEMS, EquipmentSlot } from '../../../shared/src/types/Items';
export class EquipmentVisualSystem extends System {
    puppetRefs = new Map();
    constructor() {
        super();
    }
    registerPuppet(entityId, puppet) {
        this.puppetRefs.set(entityId, puppet);
    }
    update(dt, world) {
        for (const [entityId, puppet] of this.puppetRefs) {
            const equipment = world.getComponent(entityId, Equipment);
            if (!equipment)
                continue;
            this.syncEquipment(puppet, equipment);
        }
    }
    syncEquipment(puppet, equipment) {
        for (const slot in equipment.slots) {
            const itemId = equipment.slots[slot];
            // On pourrait optimiser en ne mettant à jour que si l'itemId a changé
            // Pour cet exercice, on simplifie
            if (itemId) {
                const item = ARTHURIAN_WEAPONS[itemId] || ITEMS[itemId];
                if (item && item.visuals) {
                    this.applyVisual(puppet, slot, item);
                }
            }
            else {
                this.clearSlot(puppet, slot);
            }
        }
    }
    applyVisual(puppet, slot, item) {
        // Création d'un mesh temporaire pour représenter l'item
        // Dans un vrai jeu, on chargerait un modèle 3D
        let geometry;
        let material = new THREE.MeshStandardMaterial({
            color: item.visuals.colorOverride || 0xcccccc,
            flatShading: true
        });
        switch (item.visuals.meshType) {
            case 'CLAYMORE':
                geometry = new THREE.BoxGeometry(0.1, 1.2, 0.05);
                break;
            case 'LONG_BOW':
                geometry = new THREE.TorusGeometry(0.4, 0.02, 8, 24, Math.PI);
                break;
            case 'DRUID_STAFF':
                geometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5);
                break;
            default:
                geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        // Positionnement spécifique selon le type d'arme
        if (item.visuals.meshType === 'CLAYMORE') {
            mesh.position.y = 0.4;
        }
        else if (item.visuals.meshType === 'DRUID_STAFF') {
            mesh.position.y = 0.5;
        }
        // Attachement
        if (slot === EquipmentSlot.MAIN_HAND) {
            puppet.attachToSocket('Socket_MainHand', mesh);
        }
        else if (slot === EquipmentSlot.OFF_HAND) {
            puppet.attachToSocket('Socket_OffHand', mesh);
        }
        else {
            // Pour les armures, on utilise setEquipment
            // Note: PuppetSlot et EquipmentSlot ne sont pas identiques, il faut mapper
            const puppetSlot = this.mapToPuppetSlot(slot);
            if (puppetSlot) {
                puppet.setEquipment(puppetSlot, mesh);
            }
        }
    }
    clearSlot(puppet, slot) {
        // Logique pour vider le socket ou le slot
        if (slot === EquipmentSlot.MAIN_HAND) {
            puppet.clearSocket('Socket_MainHand');
        }
        else if (slot === EquipmentSlot.OFF_HAND) {
            puppet.clearSocket('Socket_OffHand');
        }
        else {
            const puppetSlot = this.mapToPuppetSlot(slot);
            if (puppetSlot) {
                puppet.setEquipment(puppetSlot, null);
            }
        }
    }
    mapToPuppetSlot(slot) {
        switch (slot) {
            case EquipmentSlot.HEAD: return 'HEAD';
            case EquipmentSlot.TORSO: return 'TORSO';
            case EquipmentSlot.ARMS: return 'ARMS_UPPER'; // Simplification
            case EquipmentSlot.LEGS: return 'LEGS_UPPER'; // Simplification
            case EquipmentSlot.BACK: return 'BACK';
            default: return null;
        }
    }
}
//# sourceMappingURL=EquipmentVisualSystem.js.map