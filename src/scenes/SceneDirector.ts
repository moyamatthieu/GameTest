import * as THREE from 'three';
import { EventBus } from './EventBus';
import { EntityFactory } from './EntityFactory';
import { Constants } from '../utils/constants';
import { BaseScene, IGame } from './BaseScene';

interface SceneResources {
  meshes: Set<THREE.Mesh>;
  materials: Set<THREE.Material>;
  geometries: Set<THREE.BufferGeometry>;
  lights: Set<THREE.Light>;
  entities: Set<number>;
}

export class SceneDirector {
  private game: IGame;
  private eventBus: EventBus;
  private entityFactory: EntityFactory;
  public scenes: Map<string, BaseScene>;
  private currentScene: BaseScene | null = null;
  private currentSceneName = '';
  private previousSceneName = '';
  private isTransitioning = false;
  private transitionOverlay: HTMLElement | null;
  private resourceRegistry: Map<string, SceneResources>;

  constructor(game: IGame) {
    this.game = game;
    this.eventBus = new EventBus();
    this.entityFactory = new EntityFactory(game.assetManager, game.world);

    this.scenes = new Map();
    this.transitionOverlay = document.getElementById('scene-transition');
    this.resourceRegistry = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.on('scene:switch', (data: any) => {
      this.switchScene(data.sceneName, data.options);
    });

    this.eventBus.on('entity:create', (data: any) => {
      this.createEntity(data.type, data.options);
    });

    this.eventBus.on('entity:destroy', (data: any) => {
      this.destroyEntity(data.entityId);
    });

    window.addEventListener('beforeunload', () => {
      this.cleanupAllScenes();
    });
  }

  registerScene(name: string, sceneInstance: BaseScene): void {
    sceneInstance.director = this;
    sceneInstance.eventBus = this.eventBus;
    sceneInstance.entityFactory = this.entityFactory;
    this.scenes.set(name, sceneInstance);
  }

  async switchScene(sceneName: string, options: any = {}): Promise<void> {
    if (!this.scenes.has(sceneName)) {
      console.error(`Scene not found: ${sceneName}`);
      return;
    }

    if (this.currentSceneName === sceneName || this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;

    if (this.currentScene) {
      this.eventBus.emit('scene:exiting', {
        scene: this.currentSceneName,
        nextScene: sceneName
      });
    }

    await this.startTransition(options.transitionDuration || 500);

    if (this.currentScene) {
      await this.teardownScene(this.currentSceneName);
    }

    this.previousSceneName = this.currentSceneName;
    this.currentSceneName = sceneName;
    this.currentScene = this.scenes.get(sceneName)!;

    this.eventBus.emit('scene:entering', {
      scene: sceneName,
      previousScene: this.previousSceneName
    });

    await this.initializeScene(sceneName, options.initData || {});
    this.updateSceneUI(sceneName);

    if (this.game.networkManager) {
      this.game.networkManager.switchScene(sceneName);
    }

    await this.endTransition(options.transitionDuration || 500);

    this.eventBus.emit('scene:entered', {
      scene: sceneName,
      previousScene: this.previousSceneName
    });

    this.isTransitioning = false;
  }

  async initializeScene(sceneName: string, initData: any = {}): Promise<void> {
    const scene = this.scenes.get(sceneName);
    if (!scene) return;

    try {
      this.resourceRegistry.set(sceneName, {
        meshes: new Set(),
        materials: new Set(),
        geometries: new Set(),
        lights: new Set(),
        entities: new Set()
      });

      await scene.init(initData);
    } catch (error) {
      console.error(`Failed to initialize scene ${sceneName}:`, error);
    }
  }

  async teardownScene(sceneName: string): Promise<void> {
    const scene = this.scenes.get(sceneName);
    if (!scene) return;

    try {
      await scene.init(); // Should be teardown if exists
      this.cleanupSceneResources(sceneName);
      scene.scene.clear();
    } catch (error) {
      console.error(`Failed to teardown scene ${sceneName}:`, error);
    }
  }

  cleanupAllScenes(): void {
    for (const sceneName of this.scenes.keys()) {
      this.cleanupSceneResources(sceneName);
    }
    this.resourceRegistry.clear();
  }

  cleanupSceneResources(sceneName: string): void {
    const resources = this.resourceRegistry.get(sceneName);
    if (!resources) return;

    for (const geometry of resources.geometries) geometry.dispose();
    for (const material of resources.materials) material.dispose();

    resources.geometries.clear();
    resources.materials.clear();
    resources.meshes.clear();
    resources.lights.clear();
    resources.entities.clear();

    this.resourceRegistry.delete(sceneName);
  }

  registerResource(sceneName: string, type: string, resource: any): void {
    const resources = this.resourceRegistry.get(sceneName);
    if (!resources) return;

    switch (type) {
      case 'mesh': resources.meshes.add(resource); break;
      case 'material': resources.materials.add(resource); break;
      case 'geometry': resources.geometries.add(resource); break;
      case 'light': resources.lights.add(resource); break;
      case 'entity': resources.entities.add(resource); break;
    }
  }

  async startTransition(duration: number): Promise<void> {
    if (this.transitionOverlay) {
      this.transitionOverlay.classList.add('active');
      await new Promise(resolve => setTimeout(resolve, duration / 2));
    }
  }

  async endTransition(duration: number): Promise<void> {
    if (this.transitionOverlay) {
      this.transitionOverlay.classList.remove('active');
      await new Promise(resolve => setTimeout(resolve, duration / 2));
    }
  }

  updateSceneUI(sceneName: string): void {
    const sceneNameEl = document.getElementById('current-scene-name');
    if (sceneNameEl) sceneNameEl.textContent = sceneName;

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const navId = (Constants.NAV_IDS as any)[sceneName.toUpperCase()];
    const activeBtn = navId ? document.getElementById(navId) : document.getElementById(`nav-${sceneName}`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  createEntity(type: string, options: any = {}): number | null {
    try {
      let entity: number | null = null;

      switch (type) {
        case 'building':
          entity = this.entityFactory.createBuilding(options.buildingType, options.position, options);
          break;
        case 'ship':
          entity = this.entityFactory.createShip(options.name, options.position, options.faction, options);
          break;
        case 'planet':
          entity = this.entityFactory.createPlanet(options.name, options.planetType, options);
          break;
        case 'starSystem':
          entity = this.entityFactory.createStarSystem(options.name, options.position, options);
          break;
      }

      if (entity !== null && this.currentSceneName) {
        this.registerResource(this.currentSceneName, 'entity', entity);
      }

      this.eventBus.emit('entity:created', { type, entity, options });
      return entity;
    } catch (error) {
      console.error(`Failed to create entity of type ${type}:`, error);
      return null;
    }
  }

  destroyEntity(entityId: number): void {
    try {
      this.game.world.destroyEntity(entityId);
      this.eventBus.emit('entity:destroyed', { entityId });
    } catch (error) {
      console.error(`Failed to destroy entity ${entityId}:`, error);
    }
  }

  getCurrentScene(): BaseScene | null { return this.currentScene; }
  getCurrentSceneName(): string { return this.currentSceneName; }
  hasScene(sceneName: string): boolean { return this.scenes.has(sceneName); }
  getScene(sceneName: string): BaseScene | null { return this.scenes.get(sceneName) || null; }

  update(deltaTime: number): void {
    if (this.currentScene) this.currentScene.update(deltaTime);
  }

  render(renderer: THREE.WebGLRenderer): void {
    if (this.currentScene) this.currentScene.render(renderer);
  }

  onResize(width: number, height: number): void {
    for (const scene of this.scenes.values()) {
      scene.onResize(width, height);
    }
  }

  getEventBus(): EventBus { return this.eventBus; }
  getEntityFactory(): EntityFactory { return this.entityFactory; }
}
