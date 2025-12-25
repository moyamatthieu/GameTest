import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Constants } from '../utils/constants.js';
import { BaseScene } from './BaseScene.js';
import { PlanetGenerator } from '../planet/PlanetGenerator.js';
import { BuildingGrid } from '../planet/BuildingGrid.js';
import { PlacementValidator } from '../planet/PlacementValidator.js';

export class PlanetScene extends BaseScene {
  constructor(game) {
    super(Constants.SCENES.PLANET, game);
    this.planetRadius = 100;
    this.planetEntityId = null;
    this.controls = null;

    // Nouveau système de planète procédurale
    this.planetGenerator = null;
    this.buildingGrid = null;
    this.placementValidator = null;
    this.planetMesh = null;
  }

  async init(initData = {}) {
    this.scene.clear();

    console.log('[PlanetScene] Initializing with procedural planet generation...');

    // Attendre un court instant pour s'assurer que le monde est synchronisé
    if (this.game.world.entities.size === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 1. Créer le générateur de planète procédurale
    this.planetGenerator = new PlanetGenerator({
      radius: this.planetRadius,
      segments: 128,
      seed: Math.random(),
      heightScale: 15,
      octaves: 4,
      seaLevel: -5,
      mountainThreshold: 8
    });

    console.log('[PlanetScene] Planet generator created');

    // 2. Générer la géométrie avec relief
    const planetGeometry = this.planetGenerator.generate();
    const planetMaterial = this.planetGenerator.createMaterial();

    this.planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    this.planetMesh.castShadow = true;
    this.planetMesh.receiveShadow = true;
    this.scene.add(this.planetMesh);

    console.log('[PlanetScene] Planet mesh generated with procedural terrain');

    // 3. Trouver ou créer l'entité planète dans le monde ECS
    const planetEntities = this.game.world.getEntitiesWith('Planet');
    if (planetEntities.length > 0) {
      this.planetEntityId = planetEntities[0];
      console.log(`[PlanetScene] Planet entity found: ${this.planetEntityId}`);
    } else {
      console.warn("[PlanetScene] No planet entity found, creating fallback");
      this.planetEntityId = this.entityFactory.createPlanet('Planet Alpha', 'terrestre', {
        radius: this.planetRadius
      });
    }

    // Associer le mesh à l'entité pour MeshSync
    this.planetMesh.userData.entityId = this.planetEntityId;

    // Forcer l'enregistrement dans MeshSync
    if (this.game.meshSync) {
      this.game.meshSync.entityMeshes.set(this.planetEntityId, this.planetMesh);
    }

    // 4. Créer la grille de construction
    this.buildingGrid = new BuildingGrid(this.planetGenerator, {
      cellSize: 5,
      maxSlope: 25
    });

    console.log('[PlanetScene] Building grid initialized');

    // 5. Créer le validateur de placement
    this.placementValidator = new PlacementValidator(
      this.planetGenerator,
      this.buildingGrid
    );

    console.log('[PlanetScene] Placement validator initialized');

    // 6. Initialiser le BuildingPlacer avec les nouveaux systèmes
    if (this.game.buildingPlacer) {
      this.game.buildingPlacer.initialize(
        this.planetGenerator,
        this.buildingGrid,
        this.placementValidator
      );
    }

    // 7. Optionnel : Créer la grille visuelle (debug)
    // this.buildingGrid.createVisualGrid(this.scene);

    // 8. Créer une overlay de debug des biomes (optionnel)
    // const biomeOverlay = this.planetGenerator.generateDebugOverlay();
    // this.scene.add(biomeOverlay);

    // Configurer les lumières
    this.setupLights();

    // Configurer la caméra
    this.camera.position.set(150, 100, 150);
    this.camera.lookAt(0, 0, 0);

    // Configurer les contrôles
    this.setupControls();

    console.log('[PlanetScene] Initialization complete');
  }

  setupLights() {
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(200, 200, 200);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-200, 50, -200);
    this.scene.add(fillLight);

    // Enregistrer les lumières pour le cleanup
    if (this.director) {
      this.director.registerResource(this.name, 'light', sunLight);
      this.director.registerResource(this.name, 'light', ambientLight);
      this.director.registerResource(this.name, 'light', fillLight);
    }
  }

  setupControls() {
    if (this.controls) {
      this.controls.dispose();
    }

    this.controls = new OrbitControls(this.camera, this.game.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = this.planetRadius + 20;
    this.controls.maxDistance = this.planetRadius * 5;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 1.2;
    this.controls.update();
  }

  update(deltaTime) {
    if (this.controls) {
      this.controls.update();
    }
  }

  teardown() {
    // Nettoyage spécifique à la scène
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    console.log(`PlanetScene teardown complete`);
  }
}
