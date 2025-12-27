import * as THREE from 'three';
import { ISceneManager } from './types';
import { Starfield } from './Starfield';

export class SceneManager implements ISceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private lights: THREE.Light[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000  // Increased far plane for galaxy view
    );
    // Position camera high above to see the entire 10x10 galaxy grid
    // Grid spans approximately 900 units (10 clusters * 100 spacing - 100)
    this.camera.position.set(0, 600, 400);
    this.camera.lookAt(0, 0, 0);

    this.setupLights();
    this.setupEnvironment();
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }

  private setupEnvironment() {
    const starfield = new Starfield(2000);
    this.scene.add(starfield.getMesh());

    // Grid will be rendered per-cluster by GalaxyRenderer
    // No global grid needed
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeObject(id: string): void {
    const object = this.scene.getObjectByName(id);
    if (object) {
      this.scene.remove(object);
    }
  }

  public update(deltaTime: number): void {
    const ship = this.scene.getObjectByName('modular-ship');
    if (ship) {
      ship.rotation.y += deltaTime * 0.5;
    }
  }

  public onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public getCurrentViewScale(): 'Galaxy' | 'System' | 'Planet' {
    // This would typically be tracked by game state
    // For now, return a default - should be updated by game logic
    return 'Galaxy';
  }
}
