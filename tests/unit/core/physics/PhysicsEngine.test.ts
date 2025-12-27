import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { PhysicsEngine } from '../../../../src/core/physics/PhysicsEngine';
import { InputState, PhysicsComponent } from '../../../../src/core/physics/types';

describe('PhysicsEngine - Linear Propulsion', () => {
  let engine: PhysicsEngine;
  let object: THREE.Object3D;
  let physics: PhysicsComponent;
  let input: InputState;

  beforeEach(() => {
    engine = new PhysicsEngine();
    object = new THREE.Object3D();
    physics = {
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
      acceleration: 10,
      angularAcceleration: 2,
      maxSpeed: 50,
      maxAngularSpeed: 3,
      drag: 0.9, // High drag for testing
      angularDrag: 0.9,
    };
    input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      rollLeft: false,
      rollRight: false,
      brake: false,
      boost: false,
    };
  });

  it('should accelerate forward when forward input is true', () => {
    input.forward = true;
    engine.update(object, physics, input, 1); // 1 second delta

    // Forward is -Z in Three.js by default for cameras/objects
    // But usually for ships we might define +Z or -Z.
    // Let's assume -Z is forward (standard Three.js).
    expect(physics.velocity.z).toBeLessThan(0);
  });

  it('should decelerate when backward input is true', () => {
    input.backward = true;
    engine.update(object, physics, input, 1);
    expect(physics.velocity.z).toBeGreaterThan(0);
  });

  it('should apply drag when no input is provided', () => {
    physics.velocity.set(0, 0, -10);
    engine.update(object, physics, input, 1);
    expect(Math.abs(physics.velocity.z)).toBeLessThan(10);
  });

  it('should respect max speed', () => {
    input.forward = true;
    physics.velocity.set(0, 0, -100);
    engine.update(object, physics, input, 1);
    expect(physics.velocity.length()).toBeLessThanOrEqual(physics.maxSpeed);
  });

  describe('6DOF Rotations', () => {
    it('should rotate left (yaw) when left input is true', () => {
      input.left = true;
      engine.update(object, physics, input, 1);
      expect(physics.angularVelocity.y).toBeGreaterThan(0);
    });

    it('should rotate up (pitch) when up input is true', () => {
      input.up = true;
      engine.update(object, physics, input, 1);
      expect(physics.angularVelocity.x).toBeGreaterThan(0);
    });

    it('should roll left when rollLeft input is true', () => {
      input.rollLeft = true;
      engine.update(object, physics, input, 1);
      expect(physics.angularVelocity.z).toBeGreaterThan(0);
    });

    it('should apply angular drag', () => {
      physics.angularVelocity.set(0, 10, 0);
      engine.update(object, physics, input, 1);
      expect(Math.abs(physics.angularVelocity.y)).toBeLessThan(10);
    });
  });

  describe('Advanced Maneuvers', () => {
    it('should apply extra drag when brake is true', () => {
      physics.velocity.set(0, 0, -10);
      input.brake = true;
      engine.update(object, physics, input, 1);
      // Without brake, drag is 0.9. With brake, it should be much lower (more drag).
      expect(Math.abs(physics.velocity.z)).toBeLessThan(9);
    });

    it('should accelerate faster when boost is true', () => {
      input.forward = true;
      engine.update(object, physics, input, 1);
      const normalVelocity = physics.velocity.z;

      physics.velocity.set(0, 0, 0);
      input.boost = true;
      engine.update(object, physics, input, 1);
      const boostVelocity = physics.velocity.z;

      expect(Math.abs(boostVelocity)).toBeGreaterThan(Math.abs(normalVelocity));
    });
  });
});
