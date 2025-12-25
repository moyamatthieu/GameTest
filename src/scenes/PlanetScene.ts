import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Constants } from '../utils/constants';
import { BaseScene, IGame } from './BaseScene';
import { PlanetGenerator } from '../planet/PlanetGenerator';
import { BuildingGrid } from '../planet/BuildingGrid';
import { PlacementValidator } from '../planet/PlacementValidator';

export class PlanetScene extends BaseScene {
  private planetRadius = 100;
  public planetEntityId: number | null = null;
  private controls: OrbitControls | null = null;
  private planetGenerator: PlanetGenerator | null = null;
  private buildingGrid: BuildingGrid | null = null;
  private placementValidator: PlacementValidator | null = null;
  private planetMesh: THREE.Mesh | null = null;

  constructor(game: IGame) {
    super(Constants.SCENES.PLANET, game);
  }

  async init(initData: any = {}): Promise<void> {
    this.scene.clear();

    if ((this.game.world as any).entities.size === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.planetGenerator = new PlanetGenerator({
      radius: this.planetRadius,
      segments: 128,
      seed: Math.random(),
      heightScale: 15,
      octaves: 4,
      seaLevel: -5,
      mountainThreshold: 8
    });

    const planetGeometry = this.planetGenerator.generate();
    const planetMaterial = this.planetGenerator.createMaterial();

    this.planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    this.planetMesh.castShadow = true;
    this.planetMesh.receiveShadow = true;
    this.scene.add(this.planetMesh);

    const planetEntities = this.game.world.getEntitiesWith('Planet');
    if (planetEntities.length > 0) {
      this.planetEntityId = planetEntities[0];
    } else if (this.entityFactory) {
      this.planetEntityId = this.entityFactory.createPlanet('Planet Alpha', 'terrestre', {
        radius: this.planetRadius
      });
    }

    if (this.planetMesh && this.planetEntityId !== null) {
      this.planetMesh.userData.entityId = this.planetEntityId;
      if ((this.game as any).meshSync) {
        (this.game as any).meshSync.entityMeshes.set(this.planetEntityId, this.planetMesh);
      }
    }

    this.buildingGrid = new BuildingGrid(this.planetGenerator, { cellSize: 5, maxSlope: 25 });
    this.placementValidator = new PlacementValidator(this.planetGenerator, this.buildingGrid);

    if ((this.game as any).buildingPlacer) {
      (this.game as any).buildingPlacer.initialize(this.planetGenerator, this.buildingGrid, this.placementValidator);
    }

    this.setupLights();
    this.camera.position.set(150, 100, 150);
    this.camera.lookAt(0, 0, 0);
    this.setupControls();
  }

  private setupLights(): void {
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(200, 200, 200);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-200, 50, -200);
    this.scene.add(fillLight);

    if (this.director) {
      this.director.registerResource(this.name, 'light', sunLight);
      this.director.registerResource(this.name, 'light', ambientLight);
      this.director.registerResource(this.name, 'light', fillLight);
    }
  }

  private setupControls(): void {
    if (this.controls) this.controls.dispose();
    this.controls = new OrbitControls(this.camera, this.game.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = this.planetRadius + 20;
    this.controls.maxDistance = this.planetRadius * 5;
    this.controls.update();
  }

  update(deltaTime: number): void {
    if (this.controls) this.controls.update();
  }

  async teardown(): Promise<void> {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
  }
}
