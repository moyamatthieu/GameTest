import * as THREE from 'three';
import { AssetManager } from '../core/AssetManager';
import { World } from '../ecs/World';
import { SceneDirector } from './SceneDirector';
import { EventBus } from './EventBus';
import { EntityFactory } from './EntityFactory';

export interface IGame {
  assetManager: AssetManager;
  world: World;
  renderer: THREE.WebGLRenderer;
  networkManager: any;
}

export class BaseScene {
  public name: string;
  public game: IGame;
  public assetManager: AssetManager;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public floatingOrigin: THREE.Vector3;
  public director?: SceneDirector;
  public eventBus?: EventBus;
  public entityFactory?: EntityFactory;

  constructor(name: string, game: IGame) {
    this.name = name;
    this.game = game;
    this.assetManager = game.assetManager;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
    this.floatingOrigin = new THREE.Vector3(0, 0, 0);
  }

  async init(initData: any = {}): Promise<void> {
    // To be overridden
  }

  update(deltaTime: number): void {
    // To be overridden
  }

  render(renderer: THREE.WebGLRenderer): void {
    renderer.render(this.scene, this.camera);
  }

  onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  updateFloatingOrigin(threshold = 1000): void {
    if (this.camera.position.length() > threshold) {
      const offset = this.camera.position.clone();
      this.floatingOrigin.add(offset);

      this.camera.position.set(0, 0, 0);

      this.scene.children.forEach(child => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
          child.position.sub(offset);
        }
      });
    }
  }
}
