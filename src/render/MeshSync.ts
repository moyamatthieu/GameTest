import * as THREE from 'three';
import { World } from '../ecs/World';
import { AssetManager } from '../core/AssetManager';
import { SceneManager } from '../scenes/SceneManager';
import { BaseScene } from '../scenes/BaseScene';

export class MeshSync {
  private sceneManager: SceneManager;
  private assetManager: AssetManager;
  public entityMeshes: Map<number, THREE.Mesh>;
  private lastScene: BaseScene | null = null;

  constructor(sceneManager: SceneManager, assetManager: AssetManager) {
    this.sceneManager = sceneManager;
    this.assetManager = assetManager;
    this.entityMeshes = new Map();
  }

  update(world: World): void {
    const currentScene = this.sceneManager.currentScene;
    if (!currentScene) return;

    if (this.lastScene !== currentScene) {
      this.clearAll();
      this.lastScene = currentScene;
    }

    const entities = world.getEntitiesWith('Position', 'Renderable');

    for (const entity of entities) {
      const pos = world.getComponent<any>(entity, 'Position');
      const renderable = world.getComponent<any>(entity, 'Renderable');

      if (!this.entityMeshes.has(entity)) {
        this.createMesh(entity, renderable, currentScene);
      }

      const mesh = this.entityMeshes.get(entity);
      if (mesh && pos) {
        if (!mesh.parent) {
          currentScene.scene.add(mesh);
        }
        mesh.position.set(pos.x, pos.y, pos.z);

        const rotation = world.getComponent<any>(entity, 'Rotation');
        if (rotation) {
          mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        }
      }
    }

    this.cleanupDestroyedEntities(world);
  }

  private createMesh(entityId: number, renderable: any, scene: BaseScene): void {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let mesh: THREE.Mesh;

    switch (renderable.type) {
      case 'building':
        geometry = this.getBuildingGeometry(renderable.buildingType);
        material = new THREE.MeshStandardMaterial({ color: renderable.color || 0x808080 });
        mesh = new THREE.Mesh(geometry, material);
        break;
      case 'ship':
        geometry = new THREE.ConeGeometry(0.5, 2, 4);
        material = new THREE.MeshStandardMaterial({ color: renderable.color || 0x4488ff });
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;
        break;
      case 'cargo_ship':
        geometry = new THREE.BoxGeometry(1, 1, 2);
        material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        mesh = new THREE.Mesh(geometry, material);
        break;
      case 'planet':
        const radius = renderable.radius || 100;
        geometry = new THREE.SphereGeometry(radius, 64, 64);
        material = new THREE.MeshPhongMaterial({ color: renderable.color || 0x2e7d32, shininess: 10 });
        mesh = new THREE.Mesh(geometry, material);
        break;
      case 'star':
        geometry = new THREE.SphereGeometry(renderable.radius || 20, 32, 32);
        material = new THREE.MeshBasicMaterial({ color: renderable.color || 0xffff00 });
        mesh = new THREE.Mesh(geometry, material);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        mesh = new THREE.Mesh(geometry, material);
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.entityId = entityId;

    scene.scene.add(mesh);
    this.entityMeshes.set(entityId, mesh);
    renderable.mesh = mesh;
  }

  private getBuildingGeometry(buildingType: string): THREE.BufferGeometry {
    switch (buildingType) {
      case 'base': return this.assetManager.getGeometry('geo_base', () => new THREE.BoxGeometry(3, 4, 3));
      case 'habitation': return this.assetManager.getGeometry('geo_habitation', () => new THREE.BoxGeometry(2, 2, 2));
      case 'ferme': return this.assetManager.getGeometry('geo_ferme', () => new THREE.CylinderGeometry(1.5, 1.5, 1, 32));
      case 'usine': return this.assetManager.getGeometry('geo_usine', () => new THREE.BoxGeometry(2.5, 2, 2.5));
      case 'entrepot': return this.assetManager.getGeometry('geo_entrepot', () => new THREE.BoxGeometry(2.5, 1.5, 4));
      case 'centrale': return this.assetManager.getGeometry('geo_centrale', () => new THREE.CylinderGeometry(1, 1.5, 3, 16));
      case 'mine': return this.assetManager.getGeometry('geo_mine', () => new THREE.ConeGeometry(1.5, 2.5, 4));
      case 'route': return this.assetManager.getGeometry('geo_route', () => new THREE.BoxGeometry(2, 0.2, 2));
      default: return new THREE.BoxGeometry(2, 2, 2);
    }
  }

  private cleanupDestroyedEntities(world: World): void {
    for (const [entityId, mesh] of this.entityMeshes.entries()) {
      const exists = (world as any).entities.has(entityId) && world.hasComponent(entityId, 'Position') && world.hasComponent(entityId, 'Renderable');
      if (!exists) {
        if (mesh.parent) mesh.parent.remove(mesh);
        this.entityMeshes.delete(entityId);
      }
    }
  }

  clearAll(): void {
    for (const mesh of this.entityMeshes.values()) {
      if (mesh.parent) mesh.parent.remove(mesh);
    }
    this.entityMeshes.clear();
  }
}
