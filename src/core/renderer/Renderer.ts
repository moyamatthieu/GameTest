import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManager } from './SceneManager';
import { CameraController } from './CameraController';

export class Renderer {
  private renderer: THREE.WebGLRenderer;
  private sceneManager: SceneManager;
  public cameraController?: CameraController;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.sceneManager.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    window.addEventListener('resize', () => this.onResize());
  }

  public setCameraController(controller: CameraController) {
    this.cameraController = controller;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  public stop() {
    this.isRunning = false;
  }

  private animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    this.controls.update();
    if (this.cameraController) {
      this.cameraController.update(deltaTime);
    }
    this.sceneManager.update(deltaTime);
    this.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.sceneManager.onResize(width, height);
  }
}
