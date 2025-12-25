import * as THREE from 'three';

export class AssetManager {
  private geometries: Map<string, THREE.BufferGeometry>;
  private materials: Map<string, THREE.Material>;
  private textures: Map<string, THREE.Texture>;
  private textureLoader: THREE.TextureLoader;
  private pools: Map<string, THREE.Object3D[]>;

  constructor() {
    this.geometries = new Map();
    this.materials = new Map();
    this.textures = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.pools = new Map();
  }

  getGeometry<T extends THREE.BufferGeometry>(key: string, factory: () => T): T {
    if (!this.geometries.has(key)) {
      this.geometries.set(key, factory());
    }
    return this.geometries.get(key) as T;
  }

  getMaterial<T extends THREE.Material>(key: string, factory: () => T): T {
    if (!this.materials.has(key)) {
      this.materials.set(key, factory());
    }
    return this.materials.get(key) as T;
  }

  loadTexture(url: string): THREE.Texture {
    if (!this.textures.has(url)) {
      this.textures.set(url, this.textureLoader.load(url));
    }
    return this.textures.get(url)!;
  }

  getFromPool<T extends THREE.Object3D>(key: string, factory: () => T): T {
    if (!this.pools.has(key)) {
      this.pools.set(key, []);
    }

    const pool = this.pools.get(key)!;
    if (pool.length > 0) {
      const obj = pool.pop() as T;
      obj.visible = true;
      return obj;
    }

    return factory();
  }

  releaseToPool(key: string, object: THREE.Object3D): void {
    if (!this.pools.has(key)) {
      this.pools.set(key, []);
    }

    object.visible = false;
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    object.scale.set(1, 1, 1);

    this.pools.get(key)!.push(object);
  }

  dispose(): void {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
    this.textures.forEach(t => t.dispose());

    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
    this.pools.clear();
  }
}
