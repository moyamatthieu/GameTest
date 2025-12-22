import * as THREE from 'three';
import { System, World, Position, Renderable, RenderType, Equipment, EquipmentSlot, CombatState, Velocity } from 'shared';
import { Puppet } from '../puppet_system';
import { EquipmentVisualSystem } from './EquipmentVisualSystem';

export class RenderSystem extends System {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private localPlayerId: string | null = null;
  private isFirstPerson: boolean = false;
  public meshes: Map<string, THREE.Object3D> = new Map();
  private equipmentVisualSystem: EquipmentVisualSystem | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, equipmentVisualSystem?: EquipmentVisualSystem) {
    super();
    this.scene = scene;
    this.camera = camera;
    if (equipmentVisualSystem) {
      this.equipmentVisualSystem = equipmentVisualSystem;
    }
  }

  public setLocalPlayer(entityId: string): void {
    this.localPlayerId = entityId;
  }

  public setFirstPerson(enabled: boolean): void {
    this.isFirstPerson = enabled;
  }

  public update(dt: number, world: World): void {
    const entities = world.getEntitiesWith(Position, Renderable);
    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    
    this.camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    // Sync meshes with entities
    const currentEntityIds = new Set<string>();

    for (const entity of entities) {
      const pos = world.getComponent(entity, Position) as Position;
      const renderable = world.getComponent(entity, Renderable) as Renderable;
      const entityId = entity;
      currentEntityIds.add(entityId);

      let mesh = this.meshes.get(entityId);

      if (!mesh) {
        // Create new mesh
        mesh = this.createMesh(renderable);
        this.scene.add(mesh);
        this.meshes.set(entityId, mesh);

        // Register puppet for equipment visuals
        if (mesh instanceof Puppet && this.equipmentVisualSystem) {
          this.equipmentVisualSystem.registerPuppet(entityId, mesh);
        }
      }

      // Update mesh position and rotation
      mesh.position.set(pos.x, pos.y, pos.z);
      
      // Frustum Culling for animations and visibility
      const isVisible = frustum.containsPoint(mesh.position);
      mesh.visible = isVisible;

      if (isVisible) {
        // Update Puppet Animation and Orientation if applicable
        if (mesh instanceof Puppet) {
          const velocity = world.getComponent(entityId, Velocity) as Velocity;
          if (velocity) {
            const speedSq = velocity.vx * velocity.vx + velocity.vz * velocity.vz;
            
            if (speedSq > 0.1) {
              // Calculer l'angle de direction basé sur la vélocité
              const targetRotation = Math.atan2(velocity.vx, velocity.vz);
              
              // Interpolation fluide de la rotation indépendante du framerate
              let diff = targetRotation - mesh.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              
              const rotationSpeed = 10; // Radian par seconde
              const rotationStep = diff * Math.min(dt * rotationSpeed, 1.0);
              mesh.rotation.y += rotationStep;

              // Ne changer l'état de locomotion que si aucune action prioritaire n'est en cours
              if (!mesh.isActionPlaying) {
                if (speedSq > 25) {
                  mesh.setState('RUN');
                } else {
                  mesh.setState('WALK');
                }
              }
            } else {
              if (!mesh.isActionPlaying) {
                mesh.setState('IDLE');
              }
            }
            
            mesh.update(dt);
          } else {
            mesh.rotation.y = pos.rotationY;
          }
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
      }
    }
  }

  private floatingTexts: { sprite: THREE.Sprite, life: number }[] = [];

  public addFloatingText(text: string, position: THREE.Vector3, color: string = '#ff0000'): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
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

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      
      if (ft.life <= 0) {
        this.scene.remove(ft.sprite);
        ft.sprite.material.map?.dispose();
        ft.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
      } else {
        ft.sprite.position.y += dt * 1.5; // Float up
        (ft.sprite.material as THREE.SpriteMaterial).opacity = ft.life;
      }
    }
  }

  private updateCamera(pos: Position): void {
    if (this.isFirstPerson) {
      // First person: camera at player position + eye height
      const eyeHeight = 1.6;
      this.camera.position.set(pos.x, pos.y + eyeHeight, pos.z);
      
      // Orientation: use rotationY (yaw) and pitch
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = pos.rotationY;
      this.camera.rotation.x = pos.pitch;
      this.camera.rotation.z = 0;
    } else {
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

  private createMesh(renderable: Renderable): THREE.Object3D {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

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
