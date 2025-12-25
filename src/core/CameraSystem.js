import * as THREE from 'three';

export class CameraSystem {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Configuration
    this.moveSpeed = 100;
    this.zoomSpeed = 0.5;
    this.edgeMargin = 30;
    this.minZoom = 20;
    this.maxZoom = 300;
    this.minPitch = Math.PI / 6; // 30 degrés
    this.maxPitch = Math.PI / 3; // 60 degrés

    // État
    this.keys = {};
    this.mousePosition = { x: 0, y: 0 };
    this.targetPosition = new THREE.Vector3().copy(camera.position);
    this.zoomLevel = camera.position.y;

    // Limites du monde (PlanetScene)
    this.worldLimits = {
      minX: -1000,
      maxX: 1000,
      minZ: -1000,
      maxZ: 1000
    };

    this.initListeners();
  }

  initListeners() {
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

  handleZoom(delta) {
    this.zoomLevel += delta * this.zoomSpeed;
    this.zoomLevel = THREE.MathUtils.clamp(this.zoomLevel, this.minZoom, this.maxZoom);
  }

  update(deltaTime) {
    const moveDir = new THREE.Vector3();

    // ZSQD / WASD
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.x += 1;

    // Edge Scrolling
    if (this.mousePosition.x < this.edgeMargin) moveDir.x -= 1;
    if (this.mousePosition.x > window.innerWidth - this.edgeMargin) moveDir.x += 1;
    if (this.mousePosition.y < this.edgeMargin) moveDir.z -= 1;
    if (this.mousePosition.y > window.innerHeight - this.edgeMargin) moveDir.z += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.targetPosition.x += moveDir.x * this.moveSpeed * deltaTime;
      this.targetPosition.z += moveDir.z * this.moveSpeed * deltaTime;
    }

    // Clamping
    this.targetPosition.x = THREE.MathUtils.clamp(this.targetPosition.x, this.worldLimits.minX, this.worldLimits.maxX);
    this.targetPosition.z = THREE.MathUtils.clamp(this.targetPosition.z, this.worldLimits.minZ, this.worldLimits.maxZ);

    // Smooth interpolation
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.targetPosition.x, 0.1);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetPosition.z + this.zoomLevel, 0.1);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.zoomLevel, 0.1);

    // Inclinaison dynamique basée sur le zoom (plus on est proche, plus on regarde vers le bas)
    const zoomFactor = (this.zoomLevel - this.minZoom) / (this.maxZoom - this.minZoom);
    const pitch = THREE.MathUtils.lerp(this.maxPitch, this.minPitch, zoomFactor);
    
    this.camera.rotation.x = -pitch;
  }
}
