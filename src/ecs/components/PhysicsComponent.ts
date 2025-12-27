import * as THREE from 'three';
import { PhysicsComponent as IPhysicsComponent } from '../../core/physics/types';

export class PhysicsComponent implements IPhysicsComponent {
  public position: THREE.Vector3 = new THREE.Vector3();
  public quaternion: THREE.Quaternion = new THREE.Quaternion();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public angularVelocity: THREE.Vector3 = new THREE.Vector3();
  public acceleration: number = 10;
  public angularAcceleration: number = 2;
  public maxSpeed: number = 50;
  public maxAngularSpeed: number = 3;
  public drag: number = 0.98;
  public angularDrag: number = 0.95;
}
