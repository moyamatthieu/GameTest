import * as THREE from 'three';
import { CameraMode, CameraConfig } from './types';

export interface ICameraController {
  update(deltaTime: number): void;
  setTarget(target: THREE.Object3D): void;
  setMode(mode: CameraMode): void;
  cycleMode(): void;
  getMode(): CameraMode;
}

export class CameraController implements ICameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Object3D;
  private mode: CameraMode = CameraMode.CHASE;

  private config: CameraConfig = {
    mode: CameraMode.CHASE,
    offset: new THREE.Vector3(0, 5, 15),
    lookAtOffset: new THREE.Vector3(0, 0, -5),
    lerpFactor: 5,
  };

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Object3D) {
    this.camera = camera;
    this.target = target;
  }

  public setTarget(target: THREE.Object3D): void {
    this.target = target;
  }

  public setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  public getMode(): CameraMode {
    return this.mode;
  }

  public cycleMode(): void {
    const modes = Object.values(CameraMode);
    const currentIndex = modes.indexOf(this.mode);
    this.mode = modes[(currentIndex + 1) % modes.length];
    console.log(`Camera mode changed to: ${this.mode}`);
  }

  public update(deltaTime: number): void {
    if (!this.target) return;

    switch (this.mode) {
      case CameraMode.CHASE:
        this.updateChaseMode(deltaTime);
        break;
      case CameraMode.COCKPIT:
        this.updateCockpitMode(deltaTime);
        break;
      case CameraMode.ORBIT:
        this.updateOrbitMode(deltaTime);
        break;
      case CameraMode.RTS:
        this.updateRTSMode(deltaTime);
        break;
    }
  }

  private updateRTSMode(deltaTime: number): void {
    // Top-down view
    const rtsOffset = new THREE.Vector3(0, 50, 0); // High above
    const targetPos = this.target.position.clone();

    const idealPosition = targetPos.clone().add(rtsOffset);
    const t = 1.0 - Math.pow(0.01, deltaTime * this.config.lerpFactor);

    this.camera.position.lerp(idealPosition, t);
    this.camera.lookAt(targetPos);

    // Ensure "up" is consistent (North is -Z)
    this.camera.up.set(0, 0, -1);
  }

  private updateChaseMode(deltaTime: number): void {
    const idealOffset = this.config.offset.clone().applyQuaternion(this.target.quaternion);
    const idealPosition = this.target.position.clone().add(idealOffset);

    const t = 1.0 - Math.pow(0.01, deltaTime * this.config.lerpFactor);
    this.camera.position.lerp(idealPosition, t);

    const idealLookAt = this.target.position.clone().add(
      this.config.lookAtOffset.clone().applyQuaternion(this.target.quaternion)
    );
    this.camera.lookAt(idealLookAt);
  }

  private updateCockpitMode(deltaTime: number): void {
    const cockpitOffset = new THREE.Vector3(0, 0.5, -1).applyQuaternion(this.target.quaternion);
    this.camera.position.copy(this.target.position).add(cockpitOffset);

    const lookAtOffset = new THREE.Vector3(0, 0, -10).applyQuaternion(this.target.quaternion);
    this.camera.lookAt(this.target.position.clone().add(lookAtOffset));
  }

  private updateOrbitMode(deltaTime: number): void {
    // Simple orbit for now, can be enhanced with mouse input
    this.camera.lookAt(this.target.position);
  }
}
