import * as THREE from 'three';

export class BaseScene {
  constructor(name, game) {
    this.name = name;
    this.game = game;
    this.assetManager = game.assetManager;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
    this.floatingOrigin = new THREE.Vector3(0, 0, 0);
  }

  init() {
    // To be overridden
  }

  update(deltaTime) {
    // To be overridden
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  onResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  // Floating Origin logic
  updateFloatingOrigin(threshold = 1000) {
    if (this.camera.position.length() > threshold) {
      const offset = this.camera.position.clone();
      this.floatingOrigin.add(offset);

      // Move camera back to origin
      this.camera.position.set(0, 0, 0);

      // Move all objects in scene by -offset
      this.scene.children.forEach(child => {
        if (child.isMesh || child.isGroup) {
          child.position.sub(offset);
        }
      });
    }
  }
}
