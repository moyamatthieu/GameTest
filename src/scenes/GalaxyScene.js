import * as THREE from 'three';
import { Constants } from '../utils/constants.js';
import { BaseScene } from './BaseScene.js';
import * as components from '../ecs/components/index.js';

export class GalaxyScene extends BaseScene {
  constructor(game) {
    super(Constants.SCENES.GALAXY, game);
    this.influenceZones = null;
    this.starSystems = new Map();
  }

  async init(initData = {}) {
    this.scene.clear();
    this.starSystems.clear();

    // Créer le fond d'étoiles
    this.createStarfield();

    // Créer le groupe pour les zones d'influence
    this.influenceZones = new THREE.Group();
    this.scene.add(this.influenceZones);

    // Configurer la caméra
    this.camera.position.z = 500;

    // Créer les systèmes stellaires
    await this.createStarSystems();

    // Configurer les écouteurs d'événements
    this.setupEventListeners();
  }

  createStarfield() {
    const starsCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);

    // Enregistrer pour le cleanup
    if (this.director) {
      this.director.registerResource(this.name, 'geometry', geometry);
      this.director.registerResource(this.name, 'material', material);
      this.director.registerResource(this.name, 'mesh', stars);
    }
  }

  async createStarSystems() {
    const systems = this.game.world.getEntitiesWith('StarSystem', 'Sovereignty', 'Position');

    // Si aucun système n'existe, on en crée quelques-uns pour la démo
    if (systems.length === 0) {
      await this.createDemoSystems();
    } else {
      // Créer les systèmes existants
      for (const entity of systems) {
        await this.createSystemVisual(entity);
      }
    }
  }

  async createDemoSystems() {
    const demoSystems = [
      {
        name: 'Alpha Centauri',
        pos: { x: -100, y: 0, z: -50 },
        owner: this.game.playerCorp,
        color: 0x00ff00
      },
      {
        name: 'Sol',
        pos: { x: 0, y: 0, z: 0 },
        owner: this.game.playerCorp,
        color: 0x00ff00
      },
      {
        name: 'Sirius',
        pos: { x: 150, y: 50, z: 100 },
        owner: this.game.rivalCorp,
        color: 0xff0000
      }
    ];

    for (const sys of demoSystems) {
      // Utiliser EntityFactory pour créer le système stellaire
      const systemEntity = this.director.createEntity('starSystem', {
        name: sys.name,
        position: sys.pos,
        owner: sys.owner,
        influenceRadius: 50,
        influenceStrength: 0.1
      });

      if (systemEntity) {
        this.starSystems.set(systemEntity, sys);

        // Créer la zone d'influence visuelle
        const influenceZone = this.entityFactory.createInfluenceZone(
          sys.pos,
          sys.color,
          { opacity: 0.1 }
        );

        this.influenceZones.add(influenceZone);

        // Enregistrer pour le cleanup
        if (this.director) {
          this.director.registerResource(this.name, 'mesh', influenceZone);
        }
      }
    }
  }

  async createSystemVisual(entity) {
    const starSystem = this.game.world.getComponent(entity, 'StarSystem');
    const position = this.game.world.getComponent(entity, 'Position');
    const sovereignty = this.game.world.getComponent(entity, 'Sovereignty');

    if (!starSystem || !position) return;

    // Créer le mesh de l'étoile
    const starTemplate = this.entityFactory.templates.systems.star;
    const starGeometry = this.assetManager.getGeometry(
      'system_star_geo',
      starTemplate.geometry
    );

    const starMaterial = this.assetManager.getMaterial(
      'system_star_mat',
      () => new THREE.MeshBasicMaterial(starTemplate.material)
    );

    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    starMesh.position.set(position.x, position.y, position.z);
    starMesh.userData.entityId = entity;
    starMesh.name = starSystem.name;

    this.scene.add(starMesh);

    // Enregistrer pour le cleanup
    if (this.director) {
      this.director.registerResource(this.name, 'mesh', starMesh);
    }

    // Créer la zone d'influence si le système a une souveraineté
    if (sovereignty) {
      const color = sovereignty.corporationId === this.game.playerCorp ? 0x00ff00 : 0xff0000;
      const influenceZone = this.entityFactory.createInfluenceZone(
        { x: position.x, y: position.y, z: position.z },
        color,
        {
          opacity: 0.1,
          radius: sovereignty.influenceRadius || 40
        }
      );

      this.influenceZones.add(influenceZone);

      // Enregistrer pour le cleanup
      if (this.director) {
        this.director.registerResource(this.name, 'mesh', influenceZone);
      }
    }

    // Mettre à jour le composant Renderable si nécessaire
    const renderable = this.game.world.getComponent(entity, 'Renderable');
    if (!renderable) {
      this.game.world.addComponent(entity, 'Renderable', components.Renderable(starMesh));
    } else {
      renderable.mesh = starMesh;
    }

    this.starSystems.set(entity, {
      name: starSystem.name,
      pos: { x: position.x, y: position.y, z: position.z },
      owner: sovereignty ? sovereignty.corporationId : null
    });
  }

  setupEventListeners() {
    // Écouter les événements de création de systèmes
    this.eventBus.on('system:created', (data) => {
      this.createSystemFromEvent(data);
    });

    // Écouter les événements de mise à jour de souveraineté
    this.eventBus.on('sovereignty:updated', (data) => {
      this.updateSystemSovereignty(data.entityId, data.newOwner);
    });

    // Écouter les événements de suppression de systèmes
    this.eventBus.on('system:destroyed', (data) => {
      this.removeSystemVisual(data.entityId);
    });
  }

  async createSystemFromEvent(data) {
    const entity = this.director.createEntity('starSystem', {
      name: data.name,
      position: data.position,
      owner: data.owner,
      influenceRadius: data.influenceRadius || 50,
      influenceStrength: data.influenceStrength || 0.1
    });

    if (entity) {
      await this.createSystemVisual(entity);
    }
  }

  updateSystemSovereignty(entityId, newOwner) {
    const systemData = this.starSystems.get(entityId);
    if (!systemData) return;

    // Mettre à jour la couleur de la zone d'influence
    const color = newOwner === this.game.playerCorp ? 0x00ff00 : 0xff0000;

    // Supprimer l'ancienne zone d'influence
    const oldZone = this.influenceZones.children.find(child =>
      child.position.x === systemData.pos.x &&
      child.position.y === systemData.pos.y &&
      child.position.z === systemData.pos.z
    );

    if (oldZone) {
      this.influenceZones.remove(oldZone);

      // Dispose old material
      if (oldZone.material) {
        oldZone.material.dispose();
      }
    }

    // Créer la nouvelle zone d'influence
    const newInfluenceZone = this.entityFactory.createInfluenceZone(
      systemData.pos,
      color,
      { opacity: 0.1 }
    );

    this.influenceZones.add(newInfluenceZone);

    // Enregistrer pour le cleanup
    if (this.director) {
      this.director.registerResource(this.name, 'mesh', newInfluenceZone);
    }

    // Mettre à jour les données du système
    systemData.owner = newOwner;
    this.starSystems.set(entityId, systemData);
  }

  removeSystemVisual(entityId) {
    const systemData = this.starSystems.get(entityId);
    if (!systemData) return;

    // Supprimer l'étoile
    const starMesh = this.scene.children.find(child =>
      child.userData && child.userData.entityId === entityId
    );

    if (starMesh) {
      this.scene.remove(starMesh);

      // Dispose geometry and material
      if (starMesh.geometry) starMesh.geometry.dispose();
      if (starMesh.material) starMesh.material.dispose();
    }

    // Supprimer la zone d'influence
    const influenceZone = this.influenceZones.children.find(child =>
      child.position.x === systemData.pos.x &&
      child.position.y === systemData.pos.y &&
      child.position.z === systemData.pos.z
    );

    if (influenceZone) {
      this.influenceZones.remove(influenceZone);

      // Dispose material
      if (influenceZone.material) {
        influenceZone.material.dispose();
      }
    }

    // Supprimer de la map
    this.starSystems.delete(entityId);
  }

  update(deltaTime) {
    this.updateFloatingOrigin(5000);
  }

  teardown() {
    // Nettoyage spécifique à la scène
    this.starSystems.clear();
    this.influenceZones = null;

    // Supprimer les écouteurs d'événements
    if (this.eventBus) {
      this.eventBus.clear('system:created');
      this.eventBus.clear('sovereignty:updated');
      this.eventBus.clear('system:destroyed');
    }

    console.log(`GalaxyScene teardown complete`);
  }
}
