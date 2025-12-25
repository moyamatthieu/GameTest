import * as THREE from 'three';
import { Constants } from '../utils/constants.js';
import { BaseScene } from './BaseScene.js';
import * as components from '../ecs/components/index.js';

export class SystemScene extends BaseScene {
  constructor(game) {
    super(Constants.SCENES.SYSTEM, game);
    this.lasers = [];
    this.systemId = 'system_alpha';
    this.fleetEntities = new Map();
  }

  async init(initData = {}) {
    this.scene.clear();
    this.lasers = [];
    this.fleetEntities.clear();

    // Créer le soleil en utilisant EntityFactory
    const sunMesh = this.createSun();
    this.scene.add(sunMesh);

    // Créer les planètes en utilisant EntityFactory
    this.createPlanets();

    // Créer les vaisseaux en utilisant EntityFactory
    this.createShips();

    // Créer une flotte de test
    this.createTestFleet();

    // Configurer les lumières
    this.setupLights();

    // Configurer la caméra
    this.camera.position.set(0, 100, 100);
    this.camera.lookAt(0, 0, 50);

    // Configurer les écouteurs d'événements
    this.setupEventListeners();
  }

  createSun() {
    const geometry = this.assetManager.getGeometry('sun_geo', () =>
      new THREE.SphereGeometry(10, 32, 32)
    );
    const material = this.assetManager.getMaterial('sun_mat', () =>
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    const sun = new THREE.Mesh(geometry, material);
    sun.name = 'Soleil';

    // Enregistrer pour le cleanup
    if (this.director) {
      this.director.registerResource(this.name, 'mesh', sun);
    }

    return sun;
  }

  createPlanets() {
    const geometry = this.assetManager.getGeometry('system_planet_geo', () =>
      new THREE.SphereGeometry(2, 16, 16)
    );

    for (let i = 0; i < 5; i++) {
      const material = this.assetManager.getMaterial(`system_planet_mat_${i}`, () =>
        new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff })
      );
      const planet = new THREE.Mesh(geometry, material);
      planet.position.x = 30 + i * 20;
      planet.name = `Planète ${i + 1}`;
      this.scene.add(planet);

      // Enregistrer pour le cleanup
      if (this.director) {
        this.director.registerResource(this.name, 'mesh', planet);
      }
    }
  }

  createShips() {
    // Créer des vaisseaux en utilisant EntityFactory
    const ship1 = this.director.createEntity('ship', {
      name: 'Player Ship 1',
      position: { x: 0, y: 0, z: 50 },
      faction: 'player'
    });

    const ship2 = this.director.createEntity('ship', {
      name: 'Player Ship 2',
      position: { x: 5, y: 0, z: 55 },
      faction: 'player'
    });

    const enemyShip = this.director.createEntity('ship', {
      name: 'Enemy Ship',
      position: { x: 20, y: 0, z: 50 },
      faction: 'enemy'
    });

    // Stocker les IDs des vaisseaux pour la flotte
    this.fleetEntities.set('ship1', ship1);
    this.fleetEntities.set('ship2', ship2);
    this.fleetEntities.set('enemy', enemyShip);

    // Ajouter les meshes à la scène
    this.addShipMeshesToScene([ship1, ship2, enemyShip]);
  }

  addShipMeshesToScene(shipEntities) {
    for (const entity of shipEntities) {
      const renderable = this.game.world.getComponent(entity, 'Renderable');
      if (renderable && renderable.mesh && !this.scene.children.includes(renderable.mesh)) {
        this.scene.add(renderable.mesh);
      }
    }
  }

  createTestFleet() {
    // Créer une entité de flotte
    const fleetEntity = this.game.world.createEntity();

    this.game.world.addComponent(fleetEntity, 'Fleet', components.Fleet('Alpha Fleet'));
    this.game.world.addComponent(fleetEntity, 'Position', components.Position(0, 0, 50));
    this.game.world.addComponent(fleetEntity, 'Selectable', components.Selectable('fleet'));

    // Ajouter les membres à la flotte
    const fleetComp = this.game.world.getComponent(fleetEntity, 'Fleet');
    fleetComp.members.push(
      this.fleetEntities.get('ship1'),
      this.fleetEntities.get('ship2')
    );

    this.fleetEntities.set('fleet', fleetEntity);
  }

  setupLights() {
    const light = new THREE.PointLight(0xffffff, 2, 500);
    this.scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x202020);
    this.scene.add(ambientLight);

    // Enregistrer pour le cleanup
    if (this.director) {
      this.director.registerResource(this.name, 'light', light);
      this.director.registerResource(this.name, 'light', ambientLight);
    }
  }

  setupEventListeners() {
    // Écouter les événements de combat
    this.eventBus.on('combat:fire', (data) => {
      this.createLaserEffect(data.attackerPos, data.targetPos);
    });

    // Écouter les événements de création de vaisseaux
    this.eventBus.on('ship:created', (data) => {
      if (data.systemId === this.systemId) {
        this.addShipToScene(data.shipEntity);
      }
    });

    // Écouter les événements de création de vaisseaux cargo
    this.eventBus.on('cargo:created', (data) => {
      if (data.systemId === this.systemId) {
        this.addCargoShipToScene(data.cargoEntity);
      }
    });
  }

  createLaserEffect(start, end) {
    const laser = this.entityFactory.createLaser(start, end, {
      color: 0xff0000,
      width: 1
    });

    this.scene.add(laser);

    this.lasers.push({
      mesh: laser,
      life: 0.2 // secondes
    });

    // Enregistrer pour le cleanup
    if (this.director) {
      this.director.registerResource(this.name, 'mesh', laser);
    }
  }

  addShipToScene(shipEntity) {
    const renderable = this.game.world.getComponent(shipEntity, 'Renderable');
    if (renderable && renderable.mesh) {
      this.scene.add(renderable.mesh);
      this.fleetEntities.set(`ship_${shipEntity}`, shipEntity);
    }
  }

  addCargoShipToScene(cargoEntity) {
    const renderable = this.game.world.getComponent(cargoEntity, 'Renderable');
    if (renderable) {
      // Créer le mesh si nécessaire
      if (!renderable.mesh || typeof renderable.mesh === 'object' && !renderable.mesh.isMesh) {
        const cargoMesh = this.assetManager.getFromPool('cargo_ship', () => {
          const geometry = this.assetManager.getGeometry('cargo_geo', () =>
            new THREE.BoxGeometry(0.5, 0.5, 1.5)
          );
          const material = this.assetManager.getMaterial('cargo_mat', () =>
            new THREE.MeshPhongMaterial({ color: 0xaaaaaa })
          );
          return new THREE.Mesh(geometry, material);
        });

        renderable.mesh = cargoMesh;

        // Enregistrer pour le cleanup
        if (this.director) {
          this.director.registerResource(this.name, 'mesh', cargoMesh);
        }
      }

      this.scene.add(renderable.mesh);
    }
  }

  update(deltaTime) {
    this.updateFloatingOrigin();

    // Mettre à jour les lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].life -= deltaTime;
      if (this.lasers[i].life <= 0) {
        this.scene.remove(this.lasers[i].mesh);
        this.lasers.splice(i, 1);
      }
    }

    // Synchroniser les positions ECS vers les meshes
    this.syncEntityPositions();
  }

  syncEntityPositions() {
    const entities = this.game.world.getEntitiesWith('Position', 'Renderable');
    for (const entity of entities) {
      const pos = this.game.world.getComponent(entity, 'Position');
      const rend = this.game.world.getComponent(entity, 'Renderable');

      // S'assurer que le mesh est dans la scène
      if (rend.mesh && !this.scene.children.includes(rend.mesh)) {
        if (rend.type === 'cargo_ship') {
          this.addCargoShipToScene(entity);
        } else {
          this.addShipToScene(entity);
        }
      }

      // Mettre à jour la position
      if (rend.mesh && rend.mesh.position) {
        rend.mesh.position.set(pos.x, pos.y, pos.z);
      }
    }
  }

  teardown() {
    // Nettoyage spécifique à la scène
    this.lasers = [];
    this.fleetEntities.clear();

    // Supprimer les écouteurs d'événements
    if (this.eventBus) {
      this.eventBus.clear('combat:fire');
      this.eventBus.clear('ship:created');
      this.eventBus.clear('cargo:created');
    }

    console.log(`SystemScene teardown complete`);
  }
}
