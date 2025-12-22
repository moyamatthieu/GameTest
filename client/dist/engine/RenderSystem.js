import * as THREE from 'three';
import { System, Position, Renderable, RenderType, Equipment, EquipmentSlot, CombatState, Velocity } from 'shared';
import { Puppet } from '../puppet_system';
export class RenderSystem extends System {
    scene;
    camera;
    localPlayerId = null;
    isFirstPerson = false;
    meshes = new Map();
    equipmentMeshes = new Map();
    constructor(scene, camera) {
        super();
        this.scene = scene;
        this.camera = camera;
    }
    setLocalPlayer(entityId) {
        this.localPlayerId = entityId;
    }
    setFirstPerson(enabled) {
        this.isFirstPerson = enabled;
    }
    update(dt, world) {
        const entities = world.getEntitiesWith(Position, Renderable);
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        this.camera.updateMatrixWorld();
        projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);
        // Sync meshes with entities
        const currentEntityIds = new Set();
        for (const entity of entities) {
            const pos = world.getComponent(entity, Position);
            const renderable = world.getComponent(entity, Renderable);
            const entityId = entity;
            currentEntityIds.add(entityId);
            let mesh = this.meshes.get(entityId);
            if (!mesh) {
                // Create new mesh
                mesh = this.createMesh(renderable);
                this.scene.add(mesh);
                this.meshes.set(entityId, mesh);
            }
            // Update mesh position and rotation
            mesh.position.set(pos.x, pos.y, pos.z);
            // Frustum Culling for animations and visibility
            const isVisible = frustum.containsPoint(mesh.position);
            mesh.visible = isVisible;
            if (isVisible) {
                // Update Puppet Animation and Orientation if applicable
                if (mesh instanceof Puppet) {
                    const velocity = world.getComponent(entityId, Velocity);
                    if (velocity) {
                        const speedSq = velocity.vx * velocity.vx + velocity.vz * velocity.vz;
                        if (speedSq > 0.1) {
                            // Calculer l'angle de direction basé sur la vélocité
                            const targetRotation = Math.atan2(velocity.vx, velocity.vz);
                            // Interpolation fluide de la rotation (Slerp-like pour l'angle Y)
                            let diff = targetRotation - mesh.rotation.y;
                            while (diff < -Math.PI)
                                diff += Math.PI * 2;
                            while (diff > Math.PI)
                                diff -= Math.PI * 2;
                            mesh.rotation.y += diff * 0.15;
                            if (speedSq > 25) {
                                mesh.state = 'RUN';
                            }
                            else {
                                mesh.state = 'WALK';
                            }
                        }
                        else {
                            mesh.state = 'IDLE';
                        }
                    }
                    mesh.update(dt);
                }
                else {
                    mesh.rotation.y = pos.rotationY;
                }
                // Update equipment visualization
                const equipment = world.getComponent(entityId, Equipment);
                if (equipment) {
                    this.updateEquipmentVisuals(entityId, mesh, equipment, world);
                }
            }
            // Handle local player specific rendering and camera
            if (entityId === this.localPlayerId) {
                // Local player is always "visible" for the camera logic, but mesh might be hidden in 1st person
                mesh.visible = !this.isFirstPerson;
                this.updateCamera(pos);
            }
        }
        // Update floating texts
        this.updateFloatingTexts(dt);
        // Remove meshes for entities that no longer exist or no longer have Renderable/Position
        for (const [entityId, mesh] of this.meshes.entries()) {
            if (!currentEntityIds.has(entityId)) {
                this.scene.remove(mesh);
                this.meshes.delete(entityId);
                // Also remove equipment meshes
                const eqMeshes = this.equipmentMeshes.get(entityId);
                if (eqMeshes) {
                    eqMeshes.forEach(m => m.parent?.remove(m));
                    this.equipmentMeshes.delete(entityId);
                }
            }
        }
    }
    updateEquipmentVisuals(entityId, parentMesh, equipment, world) {
        let eqMeshes = this.equipmentMeshes.get(entityId);
        if (!eqMeshes) {
            eqMeshes = new Map();
            this.equipmentMeshes.set(entityId, eqMeshes);
        }
        const combatState = world.getComponent(entityId, CombatState);
        for (const slotKey in equipment.slots) {
            const slot = slotKey;
            const itemId = equipment.slots[slot];
            let currentMesh = eqMeshes.get(slot);
            // If item changed or removed
            if (currentMesh && (!itemId || currentMesh.userData.itemId !== itemId)) {
                parentMesh.remove(currentMesh);
                eqMeshes.delete(slot);
                currentMesh = undefined;
            }
            // If new item equipped
            if (itemId && !currentMesh) {
                const newMesh = this.createEquipmentMesh(itemId, slot);
                if (newMesh) {
                    newMesh.userData.itemId = itemId;
                    parentMesh.add(newMesh);
                    eqMeshes.set(slot, newMesh);
                    currentMesh = newMesh;
                }
            }
            // Procedural Animations
            if (currentMesh) {
                if (slot === EquipmentSlot.MAIN_HAND && itemId === 'sword' && combatState) {
                    // Swing animation
                    const timeSinceAttack = (Date.now() - combatState.lastAttackTime) / 1000;
                    if (timeSinceAttack < 0.3) {
                        currentMesh.rotation.x = Math.PI / 4 + Math.sin(timeSinceAttack * Math.PI / 0.3) * 1.5;
                    }
                    else {
                        currentMesh.rotation.x = Math.PI / 4;
                    }
                }
                if (slot === EquipmentSlot.OFF_HAND && itemId === 'shield' && combatState) {
                    // Block animation
                    if (combatState.isBlocking) {
                        currentMesh.position.lerp(new THREE.Vector3(0, 1.0, 0.6), 0.2);
                        currentMesh.rotation.y = Math.PI / 2;
                    }
                    else {
                        currentMesh.position.lerp(new THREE.Vector3(-0.6, 1.0, 0.3), 0.2);
                        currentMesh.rotation.y = 0;
                    }
                }
            }
        }
    }
    floatingTexts = [];
    addFloatingText(text, position, color = '#ff0000') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        context.font = 'Bold 80px Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.fillText(text, 128, 80);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.position.y += 2; // Above head
        sprite.scale.set(2, 1, 1);
        this.scene.add(sprite);
        this.floatingTexts.push({ sprite, life: 1.0 });
    }
    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                this.scene.remove(ft.sprite);
                ft.sprite.material.map?.dispose();
                ft.sprite.material.dispose();
                this.floatingTexts.splice(i, 1);
            }
            else {
                ft.sprite.position.y += dt * 1.5; // Float up
                ft.sprite.material.opacity = ft.life;
            }
        }
    }
    createEquipmentMesh(itemId, slot) {
        let geometry;
        let material;
        if (itemId.includes('sword')) {
            geometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
            material = new THREE.MeshStandardMaterial({ color: 0x95a5a6 });
        }
        else if (itemId.includes('shield')) {
            geometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
            material = new THREE.MeshStandardMaterial({ color: 0x3498db });
        }
        else {
            return null;
        }
        const mesh = new THREE.Mesh(geometry, material);
        // Position relative to player capsule
        if (slot === EquipmentSlot.MAIN_HAND) {
            mesh.position.set(0.6, 1.0, 0.3); // Right hand area
            mesh.rotation.x = Math.PI / 4; // Slanted forward
        }
        else if (slot === EquipmentSlot.OFF_HAND) {
            mesh.position.set(-0.6, 1.0, 0.3); // Left hand area
        }
        return mesh;
    }
    updateCamera(pos) {
        if (this.isFirstPerson) {
            // First person: camera at player position + eye height
            const eyeHeight = 1.6;
            this.camera.position.set(pos.x, pos.y + eyeHeight, pos.z);
            // Orientation: use rotationY (yaw) and pitch
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = pos.rotationY;
            this.camera.rotation.x = pos.pitch;
            this.camera.rotation.z = 0;
        }
        else {
            // Third person: camera behind player
            const distance = 8;
            const height = 3;
            // Calculate camera position based on rotationY and pitch
            const offset = new THREE.Vector3(0, height, distance);
            // Apply pitch (rotation around X) then yaw (rotation around Y)
            offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pos.pitch);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rotationY);
            const targetPos = new THREE.Vector3(pos.x, pos.y + 1, pos.z); // Look at player's chest/head
            const cameraPos = targetPos.clone().add(offset);
            // Smooth camera movement
            this.camera.position.lerp(cameraPos, 0.1);
            this.camera.lookAt(targetPos);
        }
    }
    createMesh(renderable) {
        let geometry;
        let material;
        switch (renderable.type) {
            case RenderType.PLAYER:
                return new Puppet();
            case RenderType.SPHERE:
                geometry = new THREE.SphereGeometry(0.5, 32, 32);
                break;
            case RenderType.BOX:
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
        }
        material = new THREE.MeshStandardMaterial({ color: renderable.color });
        return new THREE.Mesh(geometry, material);
    }
}
//# sourceMappingURL=RenderSystem.js.map