import { EventBus } from './EventBus.js';
import { EntityFactory } from './EntityFactory.js';
import { Constants } from '../utils/constants.js';

export class SceneDirector {
  constructor(game) {
    this.game = game;
    this.eventBus = new EventBus();
    this.entityFactory = new EntityFactory(game.assetManager, game.world);

    this.scenes = new Map();
    this.currentScene = null;
    this.currentSceneName = '';
    this.previousSceneName = '';

    this.isTransitioning = false;
    this.transitionOverlay = document.getElementById('scene-transition');

    this.resourceRegistry = new Map(); // Track scene-specific resources
    this.setupEventHandlers();
  }

  /**
   * Setup global event handlers
   */
  setupEventHandlers() {
    // Listen for scene switch requests
    this.eventBus.on('scene:switch', (data) => {
      this.switchScene(data.sceneName, data.options);
    });

    // Listen for entity creation requests
    this.eventBus.on('entity:create', (data) => {
      this.createEntity(data.type, data.options);
    });

    // Listen for entity destruction requests
    this.eventBus.on('entity:destroy', (data) => {
      this.destroyEntity(data.entityId);
    });

    // Global cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanupAllScenes();
    });
  }

  /**
   * Register a scene
   * @param {string} name - Scene name
   * @param {BaseScene} sceneInstance - Scene instance
   */
  registerScene(name, sceneInstance) {
    sceneInstance.director = this;
    sceneInstance.eventBus = this.eventBus;
    sceneInstance.entityFactory = this.entityFactory;

    this.scenes.set(name, sceneInstance);
    console.log(`Scene registered: ${name}`);
  }

  /**
   * Switch to a different scene
   * @param {string} sceneName - Name of the scene to switch to
   * @param {Object} options - Transition options
   */
  async switchScene(sceneName, options = {}) {
    if (!this.scenes.has(sceneName)) {
      console.error(`Scene not found: ${sceneName}`);
      return;
    }

    if (this.currentSceneName === sceneName || this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;

    // Emit scene exit event
    if (this.currentScene) {
      this.eventBus.emit('scene:exiting', {
        scene: this.currentSceneName,
        nextScene: sceneName
      });
    }

    // Start transition
    await this.startTransition(options.transitionDuration || 500);

    // Cleanup current scene
    if (this.currentScene) {
      await this.teardownScene(this.currentSceneName);
    }

    // Update scene references
    this.previousSceneName = this.currentSceneName;
    this.currentSceneName = sceneName;
    this.currentScene = this.scenes.get(sceneName);

    // Emit scene entering event
    this.eventBus.emit('scene:entering', {
      scene: sceneName,
      previousScene: this.previousSceneName
    });

    // Initialize new scene
    await this.initializeScene(sceneName, options.initData || {});

    // Update UI
    this.updateSceneUI(sceneName);

    // Inform server about scene change
    if (this.game.networkManager) {
      this.game.networkManager.switchScene(sceneName);
    }

    // End transition
    await this.endTransition(options.transitionDuration || 500);

    // Emit scene entered event
    this.eventBus.emit('scene:entered', {
      scene: sceneName,
      previousScene: this.previousSceneName
    });

    this.isTransitioning = false;
  }

  /**
   * Initialize a scene
   * @param {string} sceneName - Scene name
   * @param {Object} initData - Initialization data
   */
  async initializeScene(sceneName, initData = {}) {
    const scene = this.scenes.get(sceneName);
    if (!scene) return;

    try {
      // Register scene-specific resources
      this.resourceRegistry.set(sceneName, {
        meshes: new Set(),
        materials: new Set(),
        geometries: new Set(),
        lights: new Set(),
        entities: new Set()
      });

      // Call scene's init method
      await scene.init(initData);

      console.log(`Scene initialized: ${sceneName}`);
    } catch (error) {
      console.error(`Failed to initialize scene ${sceneName}:`, error);
    }
  }

  /**
   * Teardown a scene
   * @param {string} sceneName - Scene name
   */
  async teardownScene(sceneName) {
    const scene = this.scenes.get(sceneName);
    if (!scene) return;

    try {
      // Call scene's teardown method if it exists
      if (typeof scene.teardown === 'function') {
        await scene.teardown();
      }

      // Cleanup scene-specific resources
      this.cleanupSceneResources(sceneName);

      // Clear the scene
      scene.scene.clear();

      console.log(`Scene teardown complete: ${sceneName}`);
    } catch (error) {
      console.error(`Failed to teardown scene ${sceneName}:`, error);
    }
  }

  /**
   * Cleanup all scenes
   */
  cleanupAllScenes() {
    for (const sceneName of this.scenes.keys()) {
      this.cleanupSceneResources(sceneName);
    }
    this.resourceRegistry.clear();
  }

  /**
   * Cleanup scene-specific resources
   * @param {string} sceneName - Scene name
   */
  cleanupSceneResources(sceneName) {
    const resources = this.resourceRegistry.get(sceneName);
    if (!resources) return;

    // Dispose geometries
    for (const geometry of resources.geometries) {
      geometry.dispose();
    }

    // Dispose materials
    for (const material of resources.materials) {
      material.dispose();
    }

    // Note: Meshes are automatically disposed when their geometry/material is disposed
    // Note: Entities are handled by the ECS world

    resources.geometries.clear();
    resources.materials.clear();
    resources.meshes.clear();
    resources.lights.clear();
    resources.entities.clear();

    this.resourceRegistry.delete(sceneName);
  }

  /**
   * Register a resource for cleanup
   * @param {string} sceneName - Scene name
   * @param {string} type - Resource type ('mesh', 'material', 'geometry', 'light', 'entity')
   * @param {*} resource - Resource to register
   */
  registerResource(sceneName, type, resource) {
    const resources = this.resourceRegistry.get(sceneName);
    if (!resources) return;

    switch (type) {
      case 'mesh':
        resources.meshes.add(resource);
        break;
      case 'material':
        resources.materials.add(resource);
        break;
      case 'geometry':
        resources.geometries.add(resource);
        break;
      case 'light':
        resources.lights.add(resource);
        break;
      case 'entity':
        resources.entities.add(resource);
        break;
    }
  }

  /**
   * Start scene transition
   * @param {number} duration - Transition duration in ms
   */
  async startTransition(duration) {
    if (this.transitionOverlay) {
      this.transitionOverlay.classList.add('active');
      await new Promise(resolve => setTimeout(resolve, duration / 2));
    }
  }

  /**
   * End scene transition
   * @param {number} duration - Transition duration in ms
   */
  async endTransition(duration) {
    if (this.transitionOverlay) {
      this.transitionOverlay.classList.remove('active');
      await new Promise(resolve => setTimeout(resolve, duration / 2));
    }
  }

  /**
   * Update scene UI
   * @param {string} sceneName - Current scene name
   */
  updateSceneUI(sceneName) {
    // Update scene name display
    const sceneNameEl = document.getElementById('current-scene-name');
    if (sceneNameEl) {
      sceneNameEl.textContent = sceneName;
    }

    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const constants = this.game.constants || Constants;
    const navId = constants.NAV_IDS[sceneName.toUpperCase()];
    const activeBtn = navId ? document.getElementById(navId) : document.getElementById(`nav-${sceneName}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  /**
   * Create an entity using the EntityFactory
   * @param {string} type - Entity type
   * @param {Object} options - Creation options
   * @returns {Object|null} Created entity or null
   */
  createEntity(type, options = {}) {
    try {
      let entity = null;

      switch (type) {
        case 'building':
          entity = this.entityFactory.createBuilding(
            options.buildingType,
            options.position,
            options
          );
          break;
        case 'ship':
          entity = this.entityFactory.createShip(
            options.name,
            options.position,
            options.faction,
            options
          );
          break;
        case 'planet':
          entity = this.entityFactory.createPlanet(
            options.name,
            options.planetType,
            options
          );
          break;
        case 'starSystem':
          entity = this.entityFactory.createStarSystem(
            options.name,
            options.position,
            options
          );
          break;
        default:
          console.warn(`Unknown entity type: ${type}`);
          return null;
      }

      if (entity && this.currentSceneName) {
        this.registerResource(this.currentSceneName, 'entity', entity);
      }

      // Emit entity created event
      this.eventBus.emit('entity:created', {
        type,
        entity,
        options
      });

      return entity;
    } catch (error) {
      console.error(`Failed to create entity of type ${type}:`, error);
      return null;
    }
  }

  /**
   * Destroy an entity
   * @param {number} entityId - Entity ID
   */
  destroyEntity(entityId) {
    try {
      // Remove from ECS world
      this.game.world.destroyEntity(entityId);

      // Emit entity destroyed event
      this.eventBus.emit('entity:destroyed', { entityId });
    } catch (error) {
      console.error(`Failed to destroy entity ${entityId}:`, error);
    }
  }

  /**
   * Get current scene
   * @returns {BaseScene|null} Current scene
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Get current scene name
   * @returns {string} Current scene name
   */
  getCurrentSceneName() {
    return this.currentSceneName;
  }

  /**
   * Check if a scene is registered
   * @param {string} sceneName - Scene name
   * @returns {boolean} True if scene exists
   */
  hasScene(sceneName) {
    return this.scenes.has(sceneName);
  }

  /**
   * Get a scene by name
   * @param {string} sceneName - Scene name
   * @returns {BaseScene|null} Scene instance or null
   */
  getScene(sceneName) {
    return this.scenes.get(sceneName) || null;
  }

  /**
   * Update all scenes
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * Render current scene
   * @param {THREE.WebGLRenderer} renderer - WebGL renderer
   */
  render(renderer) {
    if (this.currentScene) {
      this.currentScene.render(renderer);
    }
  }

  /**
   * Handle window resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  onResize(width, height) {
    for (const scene of this.scenes.values()) {
      scene.onResize(width, height);
    }
  }

  /**
   * Get event bus
   * @returns {EventBus} Event bus instance
   */
  getEventBus() {
    return this.eventBus;
  }

  /**
   * Get entity factory
   * @returns {EntityFactory} Entity factory instance
   */
  getEntityFactory() {
    return this.entityFactory;
  }
}
