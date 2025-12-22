import * as THREE from 'three';
import { System } from '../../../shared/src/ecs/System';
import { World } from '../../../shared/src/ecs/World';
import { Equipment } from '../../../shared/src/components/Equipment';
import { Puppet } from '../puppet_system';
import { ARTHURIAN_WEAPONS } from '../../../shared/src/constants/ArthurianItems';
import { ITEMS, EquipmentSlot, ArthurianItem } from '../../../shared/src/types/Items';

export class EquipmentVisualSystem extends System {
    private puppetRefs: Map<string, Puppet> = new Map();

    constructor() {
        super();
    }

    public registerPuppet(entityId: string, puppet: Puppet) {
        this.puppetRefs.set(entityId, puppet);
    }

    public update(dt: number, world: World): void {
        for (const [entityId, puppet] of this.puppetRefs) {
            const equipment = world.getComponent(entityId, Equipment) as Equipment;
            if (!equipment) continue;

            this.syncEquipment(puppet, equipment);
        }
    }

    private syncEquipment(puppet: Puppet, equipment: Equipment) {
        for (const slot in equipment.slots) {
            const itemId = equipment.slots[slot as EquipmentSlot];
            // On pourrait optimiser en ne mettant à jour que si l'itemId a changé
            // Pour cet exercice, on simplifie
            
            if (itemId) {
                const item = ARTHURIAN_WEAPONS[itemId] || ITEMS[itemId] as ArthurianItem;
                if (item && item.visuals) {
                    this.applyVisual(puppet, slot as EquipmentSlot, item);
                }
            } else {
                this.clearSlot(puppet, slot as EquipmentSlot);
            }
        }
    }

    private applyVisual(puppet: Puppet, slot: EquipmentSlot, item: ArthurianItem) {
        // Création d'un mesh temporaire pour représenter l'item
        // Dans un vrai jeu, on chargerait un modèle 3D
        let geometry: THREE.BufferGeometry;
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
        } else if (item.visuals.meshType === 'DRUID_STAFF') {
            mesh.position.y = 0.5;
        }

        // Attachement
        if (slot === EquipmentSlot.MAIN_HAND) {
            puppet.attachToSocket('Socket_MainHand', mesh);
        } else if (slot === EquipmentSlot.OFF_HAND) {
            puppet.attachToSocket('Socket_OffHand', mesh);
        } else {
            // Pour les armures, on utilise setEquipment
            // Note: PuppetSlot et EquipmentSlot ne sont pas identiques, il faut mapper
            const puppetSlot = this.mapToPuppetSlot(slot);
            if (puppetSlot) {
                puppet.setEquipment(puppetSlot, mesh);
            }
        }
    }

    private clearSlot(puppet: Puppet, slot: EquipmentSlot) {
        // Logique pour vider le socket ou le slot
        if (slot === EquipmentSlot.MAIN_HAND) {
            puppet.clearSocket('Socket_MainHand');
        } else if (slot === EquipmentSlot.OFF_HAND) {
            puppet.clearSocket('Socket_OffHand');
        } else {
            const puppetSlot = this.mapToPuppetSlot(slot);
            if (puppetSlot) {
                puppet.setEquipment(puppetSlot, null);
            }
        }
    }

    private mapToPuppetSlot(slot: EquipmentSlot): any {
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
