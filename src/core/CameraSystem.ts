import * as THREE from 'three';

export class CameraSystem {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private moveSpeed = 100;
  private zoomSpeed = 0.5;
  private edgeMargin = 30;
  private minZoom = 20;
  private maxZoom = 300;
  private minPitch = Math.PI / 6;
  private maxPitch = Math.PI / 3;
  private keys: Record<string, boolean> = {};
  private mousePosition = { x: 0, y: 0 };
  private targetPosition: THREE.Vector3;
  private zoomLevel: number;
  private worldLimits = { minX: -1000, maxX: 1000, minZ: -1000, maxZ: 1000 };

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.targetPosition = new THREE.Vector3().copy(camera.position);
    this.zoomLevel = camera.position.y;
    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    window.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });
    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.handleZoom(e.deltaY);
    }, { passive: false });
  }

  private handleZoom(delta: number): void {
    this.zoomLevel += delta * this.zoomSpeed;
    this.zoomLevel = THREE.MathUtils.clamp(this.zoomLevel, this.minZoom, this.maxZoom);
  }

  update(deltaTime: number): void {
    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.x += 1;

    if (this.mousePosition.x < this.edgeMargin) moveDir.x -= 1;
    if (this.mousePosition.x > window.innerWidth - this.edgeMargin) moveDir.x += 1;
    if (this.mousePosition.y < this.edgeMargin) moveDir.z -= 1;
    if (this.mousePosition.y > window.innerHeight - this.edgeMargin) moveDir.z += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.targetPosition.x += moveDir.x * this.moveSpeed * deltaTime;
      this.targetPosition.z += moveDir.z * this.moveSpeed * deltaTime;
    }

    this.targetPosition.x = THREE.MathUtils.clamp(this.targetPosition.x, this.worldLimits.minX, this.worldLimits.maxX);
    this.targetPosition.z = THREE.MathUtils.clamp(this.targetPosition.z, this.worldLimits.minZ, this.worldLimits.maxZ);

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.targetPosition.x, 0.1);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetPosition.z + this.zoomLevel, 0.1);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.zoomLevel, 0.1);

    const zoomFactor = (this.zoomLevel - this.minZoom) / (this.maxZoom - this.minZoom);
    const pitch = THREE.MathUtils.lerp(this.maxPitch, this.minPitch, zoomFactor);
    this.camera.rotation.x = -pitch;
  }
}
