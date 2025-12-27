import * as THREE from 'three';
import { InputState, PhysicsComponent } from './types';

export interface IPhysicsEngine {
  update(
    object: THREE.Object3D,
    physics: PhysicsComponent,
    input: InputState,
    deltaTime: number
  ): void;
}

export class PhysicsEngine implements IPhysicsEngine {
  public update(
    object: THREE.Object3D,
    physics: PhysicsComponent,
    input: InputState,
    deltaTime: number
  ): void {
    // 1. Linear Movement
    const thrust = new THREE.Vector3(0, 0, 0);
    if (input.forward) thrust.z -= 1;
    if (input.backward) thrust.z += 1;

    let currentAcceleration = physics.acceleration;
    if (input.boost) currentAcceleration *= 3;

    if (thrust.lengthSq() > 0) {
      thrust.normalize().multiplyScalar(currentAcceleration * deltaTime);
      // Apply thrust relative to object orientation
      thrust.applyQuaternion(object.quaternion);
      physics.velocity.add(thrust);
    }

    // Apply drag
    let currentDrag = physics.drag;
    if (input.brake) currentDrag = Math.pow(currentDrag, 5); // Much stronger drag
    physics.velocity.multiplyScalar(Math.pow(currentDrag, deltaTime));

    // Clamp speed
    let currentMaxSpeed = physics.maxSpeed;
    if (input.boost) currentMaxSpeed *= 2;
    if (physics.velocity.length() > currentMaxSpeed) {
      physics.velocity.setLength(currentMaxSpeed);
    }

    // 2. Angular Movement
    const torque = new THREE.Vector3(0, 0, 0);
    if (input.left) torque.y += 1;
    if (input.right) torque.y -= 1;
    if (input.up) torque.x += 1;
    if (input.down) torque.x -= 1;
    if (input.rollLeft) torque.z += 1;
    if (input.rollRight) torque.z -= 1;

    if (torque.lengthSq() > 0) {
      torque.normalize().multiplyScalar(physics.angularAcceleration * deltaTime);
      physics.angularVelocity.add(torque);
    }

    // Apply angular drag
    physics.angularVelocity.multiplyScalar(Math.pow(physics.angularDrag, deltaTime));

    // Clamp angular speed
    if (physics.angularVelocity.length() > physics.maxAngularSpeed) {
      physics.angularVelocity.setLength(physics.maxAngularSpeed);
    }

    // Update position and rotation
    object.position.add(physics.velocity.clone().multiplyScalar(deltaTime));
    physics.position.copy(object.position);

    const q = new THREE.Quaternion();
    q.setFromAxisAngle(
      physics.angularVelocity.clone().normalize(),
      physics.angularVelocity.length() * deltaTime
    );
    if (physics.angularVelocity.lengthSq() > 0) {
      object.quaternion.multiplyQuaternions(q, object.quaternion);
    }
    physics.quaternion.copy(object.quaternion);
  }
}
