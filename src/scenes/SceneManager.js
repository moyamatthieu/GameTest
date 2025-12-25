import { Constants } from '../utils/constants.js';
import { SceneDirector } from './SceneDirector.js';

export class SceneManager {
  constructor(game) {
    this.game = game;

    // Initialiser le SceneDirector
    this.director = new SceneDirector(game);

    // Garder l'interface publique existante pour la compatibilité
    this.scenes = this.director.scenes; // Référence directe à la map du director
    this.currentScene = null;
    this.currentSceneName = '';
    this.isTransitioning = false;
    this.transitionOverlay = document.getElementById('scene-transition');
  }

  /**
   * Add a scene (délégué au SceneDirector)
   * @param {string} name - Scene name
   * @param {BaseScene} sceneInstance - Scene instance
   */
  addScene(name, sceneInstance) {
    this.director.registerScene(name, sceneInstance);
  }

  /**
   * Switch to a different scene (délégué au SceneDirector)
   * @param {string} name - Scene name
   */
  async switchScene(name) {
    await this.director.switchScene(name);

    // Mettre à jour les références pour la compatibilité
    this.currentScene = this.director.getCurrentScene();
    this.currentSceneName = this.director.getCurrentSceneName();
  }

  /**
   * Update current scene (délégué au SceneDirector)
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.director.update(deltaTime);
  }

  /**
   * Render current scene (délégué au SceneDirector)
   * @param {THREE.WebGLRenderer} renderer - WebGL renderer
   */
  render(renderer) {
    this.director.render(renderer);
  }

  /**
   * Handle window resize (délégué au SceneDirector)
   * @param {number} width - New width
   * @param {number} height - New height
   */
  onResize(width, height) {
    this.director.onResize(width, height);
  }

  /**
   * Get SceneDirector instance
   * @returns {SceneDirector} SceneDirector instance
   */
  getDirector() {
    return this.director;
  }

  /**
   * Get EventBus instance
   * @returns {EventBus} EventBus instance
   */
  getEventBus() {
    return this.director.getEventBus();
  }

  /**
   * Get EntityFactory instance
   * @returns {EntityFactory} EntityFactory instance
   */
  getEntityFactory() {
    return this.director.getEntityFactory();
  }

  /**
   * Create an entity using the director
   * @param {string} type - Entity type
   * @param {Object} options - Creation options
   * @returns {Object|null} Created entity or null
   */
  createEntity(type, options = {}) {
    return this.director.createEntity(type, options);
  }

  /**
   * Destroy an entity using the director
   * @param {number} entityId - Entity ID
   */
  destroyEntity(entityId) {
    this.director.destroyEntity(entityId);
  }

  /**
   * Get current scene (compatibilité)
   * @returns {BaseScene|null} Current scene
   */
  getCurrentScene() {
    return this.director.getCurrentScene();
  }

  /**
   * Get current scene name (compatibilité)
   * @returns {string} Current scene name
   */
  getCurrentSceneName() {
    return this.director.getCurrentSceneName();
  }

  /**
   * Check if a scene exists (compatibilité)
   * @param {string} sceneName - Scene name
   * @returns {boolean} True if scene exists
   */
  hasScene(sceneName) {
    return this.director.hasScene(sceneName);
  }

  /**
   * Get a scene by name (compatibilité)
   * @param {string} sceneName - Scene name
   * @returns {BaseScene|null} Scene instance or null
   */
  getScene(sceneName) {
    return this.director.getScene(sceneName);
  }
}
