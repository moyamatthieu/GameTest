import * as THREE from 'three';
import { World } from '../ecs/World';
import { AssetManager } from './AssetManager';
import { Constants } from '../utils/constants';
import { uiStore } from '../ui/UIStore';
import { SceneManager } from '../scenes/SceneManager';
import { PlanetScene } from '../scenes/PlanetScene';
import { SystemScene } from '../scenes/SystemScene';
import { GalaxyScene } from '../scenes/GalaxyScene';
import { NetworkManager } from './NetworkManager';
import { PredictionEngine } from '../prediction/PredictionEngine';
import { MeshSync } from '../render/MeshSync';
import { BuildingPlacer } from '../input/BuildingPlacer';
import { IGame } from '../scenes/BaseScene';

export class Game implements IGame {
  public world: World;
  public assetManager: AssetManager;
  public uiManager: any;
  public networkManager: NetworkManager;
  public predictionEngine: PredictionEngine | null = null;
  public renderer: THREE.WebGLRenderer;
  public sceneManager: SceneManager;
  public meshSync: MeshSync;
  public buildingPlacer: BuildingPlacer;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  public playerEntity: number | null = null;
  public username = 'Invité';
  public isBuildingMode = false;
  public buildingType: string | null = null;
  public ghostBuilding: THREE.Mesh | null = null;
  public selectedEntityId: number | null = null;

  constructor() {
    this.world = new World();
    this.assetManager = new AssetManager();
    this.uiManager = {}; // Placeholder
    this.networkManager = new NetworkManager(this);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('app')?.appendChild(this.renderer.domElement);

    this.sceneManager = new SceneManager(this);
    this.sceneManager.addScene(Constants.SCENES.PLANET, new PlanetScene(this as any));
    this.sceneManager.addScene(Constants.SCENES.SYSTEM, new SystemScene(this as any));
    this.sceneManager.addScene(Constants.SCENES.GALAXY, new GalaxyScene(this as any));

    this.meshSync = new MeshSync(this.sceneManager as any, this.assetManager);
    this.buildingPlacer = new BuildingPlacer(this as any);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initEventListeners();
  }

  initPredictionEngine(): void {
    this.predictionEngine = new PredictionEngine(this.world, this.networkManager);
  }

  start(): void {
    this.sceneManager.switchScene(Constants.SCENES.PLANET);
    this.animate();
  }

  private initEventListeners(): void {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setSize(width, height);
      this.sceneManager.onResize(width, height);
    });

    window.addEventListener('keydown', (e) => {
      switch(e.key) {
        case '1': this.sceneManager.switchScene(Constants.SCENES.PLANET); break;
        case '2': this.sceneManager.switchScene(Constants.SCENES.SYSTEM); break;
        case '3': this.sceneManager.switchScene(Constants.SCENES.GALAXY); break;
        case 'Escape': this.cancelBuildingMode(); break;
      }
    });

    window.addEventListener('click', (e) => {
      if (this.isBuildingMode) {
        this.buildingPlacer.tryPlaceBuilding();
      } else {
        this.handleMouseClick(e);
      }
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  startBuildingMode(type: string): void {
    this.isBuildingMode = true;
    this.buildingType = type;
    uiStore.setState({ isBuildingMode: true, buildingType: type });
  }

  cancelBuildingMode(): void {
    this.isBuildingMode = false;
    if (this.ghostBuilding && this.sceneManager.currentScene) {
      this.sceneManager.currentScene.scene.remove(this.ghostBuilding);
    }
    this.ghostBuilding = null;
    this.buildingType = null;
    uiStore.setState({ isBuildingMode: false, buildingType: null });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const deltaTime = this.clock.getDelta();

    if (this.isBuildingMode) this.buildingPlacer.update(deltaTime);
    this.networkManager.update();
    if (this.predictionEngine) this.predictionEngine.update(deltaTime);
    this.meshSync.update(this.world);
    this.sceneManager.update(deltaTime);
    this.sceneManager.render(this.renderer);
    this.updateUIStore();
  }

  private updateUIStore(): void {
    const newState: any = {};
    const economy = this.world.getComponent<any>(this.playerEntity!, 'Economy');
    if (economy) {
      newState.resources = { metal: economy.metal, energy: economy.energy, credits: economy.credits };
    }
    uiStore.setState(newState);
  }

  private handleMouseClick(event: MouseEvent): void {
    const currentScene = this.sceneManager.currentScene;
    if (!currentScene) return;

    this.raycaster.setFromCamera(this.mouse, currentScene.camera);
    const intersects = this.raycaster.intersectObjects(currentScene.scene.children, true);

    if (intersects.length > 0) {
      let target: any = intersects[0].object;
      while (target && target.userData.entityId === undefined && target.parent) {
        target = target.parent;
      }
      if (target && target.userData.entityId !== undefined) {
        this.selectedEntityId = target.userData.entityId;
      } else {
        this.selectedEntityId = null;
      }
    } else {
      this.selectedEntityId = null;
    }
  }
}
