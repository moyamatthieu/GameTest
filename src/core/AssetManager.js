import * as THREE from 'three';

export class AssetManager {
  constructor() {
    this.geometries = new Map();
    this.materials = new Map();
    this.textures = new Map();
    this.textureLoader = new THREE.TextureLoader();

    // Pool pour la réutilisation
    this.pools = new Map();
  }

  /**
   * Récupère ou crée une géométrie
   * @param {string} key Identifiant unique
   * @param {Function} factory Fonction de création si non trouvée
   */
  getGeometry(key, factory) {
    if (!this.geometries.has(key)) {
      this.geometries.set(key, factory());
    }
    return this.geometries.get(key);
  }

  /**
   * Récupère ou crée un matériau
   * @param {string} key Identifiant unique
   * @param {Function} factory Fonction de création si non trouvée
   */
  getMaterial(key, factory) {
    if (!this.materials.has(key)) {
      this.materials.set(key, factory());
    }
    return this.materials.get(key);
  }

  /**
   * Charge une texture
   */
  loadTexture(url) {
    if (!this.textures.has(url)) {
      this.textures.set(url, this.textureLoader.load(url));
    }
    return this.textures.get(url);
  }

  /**
   * Système de pooling pour les Mesh
   */
  getFromPool(key, factory) {
    if (!this.pools.has(key)) {
      this.pools.set(key, []);
    }

    const pool = this.pools.get(key);
    if (pool.length > 0) {
      const obj = pool.pop();
      obj.visible = true;
      return obj;
    }

    return factory();
  }

  releaseToPool(key, object) {
    if (!this.pools.has(key)) {
      this.pools.set(key, []);
    }

    object.visible = false;
    // Reset transform si nécessaire
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    object.scale.set(1, 1, 1);

    this.pools.get(key).push(object);
  }

  /**
   * Nettoyage complet pour éviter les fuites mémoire
   */
  dispose() {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
    this.textures.forEach(t => t.dispose());

    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
    this.pools.clear();
  }
}
