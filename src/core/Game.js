import * as THREE from 'three';
import { World } from '../ecs/World.js';
import { AssetManager } from './AssetManager.js';
import { Constants } from '../utils/constants.js';
import { uiStore } from '../ui/UIStore.js';
import { UIManager } from '../ui/UIManager.js';
import { SceneManager } from '../scenes/SceneManager.js';
import { PlanetScene } from '../scenes/PlanetScene.js';
import { SystemScene } from '../scenes/SystemScene.js';
import { GalaxyScene } from '../scenes/GalaxyScene.js';
import { NetworkManager } from './NetworkManager.js';
import { PredictionEngine } from '../prediction/PredictionEngine.js';
import { MeshSync } from '../render/MeshSync.js';
import { BuildingPlacer } from '../input/BuildingPlacer.js';
import { Economy, Building, Position, Logistics, Combat, ShieldWedge, Renderable, Selectable, Road, Specialization, ProductionChain, Sovereignty, Corporation, Identity } from '../ecs/components/index.js';

export class Game {
  constructor() {
    this.world = new World();
    this.assetManager = new AssetManager();
    this.uiManager = new UIManager();
    this.networkManager = new NetworkManager(this);
    this.predictionEngine = null; // Initialisé après networkManager
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('app').appendChild(this.renderer.domElement);

    // ⚠️ Le client ne doit PAS exécuter de logique de simulation
    // Toute la logique métier est sur le serveur
    // Le client ne fait que du RENDU et de l'INPUT

    // Initialisation des entités locales (sera écrasé par le NetworkManager si connecté)
    this.playerEntity = null;
    this.username = 'Invité';

    this.sceneManager = new SceneManager(this);
    this.sceneManager.addScene(Constants.SCENES.PLANET, new PlanetScene(this));
    this.sceneManager.addScene(Constants.SCENES.SYSTEM, new SystemScene(this));
    this.sceneManager.addScene(Constants.SCENES.GALAXY, new GalaxyScene(this));

    // Systèmes de rendu (lecture seule des composants)
    this.meshSync = new MeshSync(this.sceneManager, this.assetManager);

    // Gestionnaires d'input (UI uniquement, pas de logique)
    this.buildingPlacer = new BuildingPlacer(this);

    this.clock = new THREE.Clock();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedEntity = null;
    this.isBuildingMode = false;
    this.buildingType = null;
    this.ghostBuilding = null;

    this.initEventListeners();
  }

  /**
   * Initialise le moteur de prédiction (appelé après la connexion réseau)
   */
  initPredictionEngine() {
    this.predictionEngine = new PredictionEngine(this.world, this.networkManager);
    console.log('[Prediction] Moteur de prédiction initialisé');
  }

  start() {
    this.sceneManager.switchScene(Constants.SCENES.PLANET);
    this.animate();
  }

  initEventListeners() {
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
        case 'Tab':
          e.preventDefault();
          this.tabTarget();
          break;
      }
    });

    window.addEventListener('click', (e) => {
      if (this.isBuildingMode) {
        this.buildingPlacer.tryPlaceBuilding();
      } else {
        this.handleMouseClick(e);
      }

      // Délégation d'événements pour les éléments créés dynamiquement (ex: flottes)
      if (e.target.classList.contains('fleet-item')) {
        this.selectEntity(parseInt(e.target.dataset.id));
      }
    });

    window.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    document.querySelectorAll('.build-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        this.startBuildingMode(type);
      });
    });

    // Boutons de navigation entre scènes
    document.getElementById(Constants.NAV_IDS.PLANET)?.addEventListener('click', () => {
      this.sceneManager.switchScene(Constants.SCENES.PLANET);
    });
    document.getElementById(Constants.NAV_IDS.SYSTEM)?.addEventListener('click', () => {
      this.sceneManager.switchScene(Constants.SCENES.SYSTEM);
    });
    document.getElementById(Constants.NAV_IDS.GALAXY)?.addEventListener('click', () => {
      this.sceneManager.switchScene(Constants.SCENES.GALAXY);
    });

    document.querySelectorAll('.logistics-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const resource = e.target.dataset.resource;
        const amount = parseInt(e.target.dataset.amount);
        this.startTransfer(resource, amount);
      });
    });

    document.addEventListener('click', (e) => {
      if (e.target.id === 'attack-btn') {
        this.attackTarget();
      }
      if (e.target.id === 'btn-formation-circle') this.setFleetFormation('circle');
      if (e.target.id === 'btn-formation-line') this.setFleetFormation('line');
      if (e.target.id === 'btn-formation-delta') this.setFleetFormation('delta');
      if (e.target.id === 'btn-jump') this.triggerFleetJump();
    });
  }

  setFleetFormation(type) {
    if (this.selectedEntityId === null) return;
    const fleet = this.world.getComponent(this.selectedEntityId, 'Fleet');
    if (fleet) {
      fleet.formation = type;
      console.log(`Formation changed to ${type} for fleet ${this.selectedEntityId}`);
    }
  }

  triggerFleetJump() {
    if (this.selectedEntityId === null) return;
    const fleet = this.world.getComponent(this.selectedEntityId, 'Fleet');
    if (fleet) {
      fleet.isJumping = true;
      fleet.jumpProgress = 0;
      // Destination arbitraire pour le test
      fleet.destination = { x: 100, y: 0, z: 100 };
      console.log(`Fleet ${this.selectedEntityId} jumping to destination`);
    }
  }

  startTransfer(resource, amount) {
    if (this.predictionEngine) {
      // Utiliser la prédiction pour une réponse immédiate
      const commandId = this.predictionEngine.predictAction('TRANSFER_RESOURCES', {
        resource,
        amount,
        fromPlanetId: this.playerEntity,
        toPlanetId: this.orbitalStation
      });
      console.log(`[Prediction] Transfert prédit: ${commandId}`);
    }

    if (this.networkManager) {
      console.log(`Requesting transfer: ${amount} ${resource} to orbit`);
      this.networkManager.socket.emit('requestTransfer', {
        resource,
        amount,
        playerId: this.playerEntity,
        targetEntityId: this.orbitalStation
      });
      return;
    }

    const economy = this.world.getComponent(this.playerEntity, 'Economy');
  }

  startBuildingMode(type) {
    this.isBuildingMode = true;
    this.buildingType = type;
    console.log(`Building mode: ${type}`);

    if (this.sceneManager.currentSceneName === Constants.SCENES.PLANET || this.sceneManager.currentSceneName === Constants.SCENES.SYSTEM) {
      const currentScene = this.sceneManager.scenes.get(this.sceneManager.currentSceneName);
      if (this.ghostBuilding) {
        currentScene.scene.remove(this.ghostBuilding);
      }

      // Création du ghost avec les nouvelles tailles adaptées à la sphère
      let geometry;
      switch (type) {
        case 'base':
          geometry = this.assetManager.getGeometry('geo_base', () => new THREE.BoxGeometry(3, 4, 3));
          break;
        case 'habitation':
          geometry = this.assetManager.getGeometry('geo_habitation', () => new THREE.BoxGeometry(2, 2, 2));
          break;
        case 'ferme':
          geometry = this.assetManager.getGeometry('geo_ferme', () => new THREE.CylinderGeometry(1.5, 1.5, 1, 32));
          break;
        case 'usine':
          geometry = this.assetManager.getGeometry('geo_usine', () => new THREE.BoxGeometry(2.5, 2, 2.5));
          break;
        case 'entrepot':
          geometry = this.assetManager.getGeometry('geo_entrepot', () => new THREE.BoxGeometry(2.5, 1.5, 4));
          break;
        case 'centrale':
          geometry = this.assetManager.getGeometry('geo_centrale', () => new THREE.CylinderGeometry(1, 1.5, 3, 16));
          break;
        case 'mine':
          geometry = this.assetManager.getGeometry('geo_mine', () => new THREE.ConeGeometry(1.5, 2.5, 4));
          break;
        case 'route':
          geometry = this.assetManager.getGeometry('geo_route', () => new THREE.BoxGeometry(2, 0.2, 2));
          break;
        default:
          geometry = this.assetManager.getGeometry('geo_default', () => new THREE.BoxGeometry(2, 2, 2));
      }

      const material = this.assetManager.getMaterial('ghost_mat', () => new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5
      }));
      this.ghostBuilding = new THREE.Mesh(geometry, material);
      currentScene.scene.add(this.ghostBuilding);
    }

    // Feedback visuel dans l'UI
    const constructionPanel = document.getElementById('construction-panel');
    if (constructionPanel) {
      constructionPanel.classList.add('building-active');
    }

    // Afficher le panneau d'information de placement
    const placementInfo = document.getElementById('placement-info');
    if (placementInfo) {
      placementInfo.style.display = 'block';
    }

    uiStore.setState({ isBuildingMode: true, buildingType: type });
  }

  handleMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  placeBuilding() {
    // Remplacé par constructionSystem.tryPlaceBuilding()
  }

  cancelBuildingMode() {
    this.isBuildingMode = false;
    if (this.ghostBuilding) {
      const currentScene = this.sceneManager.scenes.get(this.sceneManager.currentSceneName);
      if (currentScene) {
        currentScene.scene.remove(this.ghostBuilding);
      }
    }
    this.ghostBuilding = null;
    this.buildingType = null;

    // Retirer le feedback visuel
    const constructionPanel = document.getElementById('construction-panel');
    if (constructionPanel) {
      constructionPanel.classList.remove('building-active');
    }

    // Cacher le panneau d'information de placement
    const placementInfo = document.getElementById('placement-info');
    if (placementInfo) {
      placementInfo.style.display = 'none';
    }

    uiStore.setState({ isBuildingMode: false, buildingType: null });
  }

  buildBuilding(type) {
    // Cette méthode est remplacée par startBuildingMode + placeBuilding
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // ⚠️ Aucune logique de simulation côté client
    // Le client reçoit l'état du serveur via NetworkManager
    // et l'affiche uniquement

    // Mise à jour des gestionnaires d'input
    if (this.isBuildingMode) {
      this.buildingPlacer.update(deltaTime);
    }

    // Mise à jour du réseau (désérialisation + interpolation)
    this.networkManager.update();

    // Mise à jour du moteur de prédiction
    if (this.predictionEngine) {
      this.predictionEngine.update(deltaTime);
    }

    // Synchronisation du rendu avec l'état ECS
    this.meshSync.update(this.world);

    // Mise à jour des scènes (caméra, contrôles)
    this.sceneManager.update(deltaTime);

    // Rendu de la scène active
    this.sceneManager.render(this.renderer);

    // Mise à jour de l'UI
    this.updateUIStore();
    this.updateMinimap();

    // Mise à jour des statistiques de prédiction (debug)
    this.updatePredictionStats();
  }

  updateUIStore() {
    const newState = {};

    // Resources
    const economy = this.world.getComponent(this.playerEntity, 'Economy');
    if (economy) {
      newState.resources = {
        metal: economy.metal,
        energy: economy.energy,
        credits: economy.credits
      };
    }

    // Selection
    if (this.selectedEntityId !== null) {
      const combat = this.world.getComponent(this.selectedEntityId, 'Combat');
      const shield = this.world.getComponent(this.selectedEntityId, 'ShieldWedge');
      const identity = this.world.getComponent(this.selectedEntityId, 'Identity');
      const sovereignty = this.world.getComponent(this.selectedEntityId, 'Sovereignty');
      const renderable = this.world.getComponent(this.selectedEntityId, 'Renderable');
      const building = this.world.getComponent(this.selectedEntityId, 'Building');
      const selectable = this.world.getComponent(this.selectedEntityId, 'Selectable');

      let name = `Entity ${this.selectedEntityId}`;
      if (renderable && renderable.mesh && renderable.mesh.name) {
        name = renderable.mesh.name;
      } else if (building) {
        name = building.type.charAt(0).toUpperCase() + building.type.slice(1);
      }

      const details = {
        isEnemy: selectable && selectable.type === 'enemy'
      };

      if (combat) {
        details.hp = combat.hp;
        details.maxHp = combat.maxHp;
      }
      if (shield) {
        details.shield = shield.strength;
        details.maxShield = shield.maxStrength;
      }

      const ownerId = identity ? identity.ownerId : (sovereignty ? sovereignty.ownerId : null);
      if (ownerId) {
        const corp = this.world.getComponent(ownerId, 'Corporation');
        if (corp) {
          details.ownerName = corp.name;
          details.ownerColor = corp.color;
        }
      }

      newState.selection = { id: this.selectedEntityId, name, details };
    } else {
      newState.selection = { id: null, name: 'Aucune sélection', details: {} };
    }

    // Fleets
    const fleetEntities = this.world.getEntitiesWith('Fleet');
    newState.fleets = fleetEntities.map(id => {
      const fleet = this.world.getComponent(id, 'Fleet');
      return { id, name: fleet.name, shipCount: fleet.members.length };
    });

    // Production
    const productionEntities = this.world.getEntitiesWith('ProductionChain', 'Building');
    newState.production = productionEntities.map(id => {
      const chain = this.world.getComponent(id, 'ProductionChain');
      const building = this.world.getComponent(id, 'Building');
      return {
        type: building.type,
        status: chain.status,
        efficiency: chain.efficiency
      };
    });

    // Corporation
    const corp = this.world.getComponent(this.playerCorp, 'Corporation');
    if (corp) {
      newState.corporation = {
        name: corp.name,
        treasury: corp.treasury,
        color: corp.color,
        assets: corp.assets
      };
    }

    // Logistics
    const logistics = this.world.getComponent(this.playerEntity, 'Logistics');
    if (logistics) {
      newState.transfers = logistics.transfers.map(t => ({
        resource: t.resource,
        amount: t.amount,
        remainingTime: t.remainingTime
      }));
    }

    newState.currentScene = this.sceneManager.currentSceneName.toLowerCase();

    uiStore.setState(newState);
  }

  updateMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid (faint)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<width; i+=20) {
      ctx.moveTo(i, 0); ctx.lineTo(i, height);
      ctx.moveTo(0, i); ctx.lineTo(width, i);
    }
    ctx.stroke();

    // Determine scale and offset based on scene
    let scale = 0.1; // Default
    let offsetX = width / 2;
    let offsetY = height / 2;

    if (this.sceneManager.currentSceneName === Constants.SCENES.PLANET) {
      scale = 0.1; // 1000 units -> 100 pixels

      // Draw Buildings
      const buildings = this.world.getEntitiesWith('Building', 'Position');
      for (const entity of buildings) {
        const pos = this.world.getComponent(entity, 'Position');
        const building = this.world.getComponent(entity, 'Building');

        const mx = offsetX + pos.x * scale;
        const my = offsetY + pos.z * scale;

        ctx.fillStyle = this.getBuildingColor(building.type);
        ctx.fillRect(mx - 2, my - 2, 4, 4);
      }

      // Draw Camera Viewport (approx)
      const currentScene = this.sceneManager.scenes.get(this.sceneManager.currentSceneName);
      if (currentScene && currentScene.camera) {
        const camPos = currentScene.camera.position;
        const cx = offsetX + camPos.x * scale;
        const cy = offsetY + camPos.z * scale;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 10, cy - 10, 20, 20); // Simple box for now
      }
    }

    // Update Scene Indicator
    const indicator = document.getElementById('scene-indicator');
    if (indicator) indicator.textContent = this.sceneManager.currentSceneName.toUpperCase();
  }

  getBuildingColor(type) {
    switch(type) {
      case 'base': return '#ffffff';
      case 'habitation': return '#44ff44';
      case 'ferme': return '#ffff44';
      case 'usine': return '#ff4444';
      case 'entrepot': return '#884400';
      case 'centrale': return '#4444ff';
      case 'mine': return '#888888';
      case 'route': return '#555555';
      default: return '#888888';
    }
  }

  handleMouseClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const currentScene = this.sceneManager.currentScene;
    if (!currentScene) return;

    this.raycaster.setFromCamera(this.mouse, currentScene.camera);
    const intersects = this.raycaster.intersectObjects(currentScene.scene.children, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      // Chercher l'entité associée dans userData
      let target = object;
      while (target && target.userData.entityId === undefined && target.parent) {
        target = target.parent;
      }

      if (target && target.userData.entityId !== undefined) {
        this.selectEntity(target.userData.entityId);
      } else {
        this.selectEntity(null);
      }
    } else {
      this.selectEntity(null);
    }
  }

  tabTarget() {
    const entities = this.world.getEntitiesWith('Selectable');
    if (entities.length === 0) return;

    let currentIndex = entities.indexOf(this.selectedEntityId);
    let nextIndex = (currentIndex + 1) % entities.length;
    this.selectEntity(entities[nextIndex]);
  }

  selectEntity(entityId) {
    this.selectedEntityId = entityId;
    // La mise à jour de l'UI se fera via updateUIStore dans la boucle animate
  }

  attackTarget() {
    if (this.selectedEntityId === null) return;

    // Trouver le vaisseau du joueur (pour simplifier, le premier avec Selectable type 'player')
    const playerShips = this.world.getEntitiesWith('Selectable', 'Combat').filter(e => {
      return this.world.getComponent(e, 'Selectable').type === 'player';
    });

    if (playerShips.length > 0) {
      const playerShip = playerShips[0];

      // Utiliser la prédiction si disponible
      if (this.predictionEngine) {
        const commandId = this.predictionEngine.predictAction('ATTACK_TARGET', {
          attackerId: playerShip,
          targetId: this.selectedEntityId
        }, this.world.getEntity(playerShip));
        console.log(`[Prediction] Attaque prédite: ${commandId}`);
      }

      const combat = this.world.getComponent(playerShip, 'Combat');
      combat.targetId = this.selectedEntityId;
      console.log(`Player ship attacking ${this.selectedEntityId}`);
    }
  }

  /**
   * Met à jour les statistiques de prédiction dans l'UI (debug)
   */
  updatePredictionStats() {
    if (!this.predictionEngine || !this.config || !this.config.debug) return;

    const stats = this.predictionEngine.getStats();
    const statsElement = document.getElementById('prediction-stats');
    if (statsElement) {
      statsElement.innerHTML = `
        <div>Prédictions: ${stats.successfulPredictions}/${stats.totalPredictions} (${stats.successRate}%)</div>
        <div>Latence: ${stats.avgLatency}ms</div>
        <div>Rollbacks: ${stats.rollbacks}</div>
        <div>En attente: ${stats.pendingCommands}</div>
      `;
    }
  }
}
