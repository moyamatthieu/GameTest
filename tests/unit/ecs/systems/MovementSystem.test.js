import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { MovementSystem } from '../../../../src/ecs/systems/MovementSystem';
import { PhysicsEngine } from '../../../../src/core/physics/PhysicsEngine';
import { PhysicsComponent } from '../../../../src/ecs/components/PhysicsComponent';
import { NavigationComponent, NavigationState } from '../../../../src/ecs/components/NavigationComponent';
describe('MovementSystem', () => {
    let movementSystem;
    let physicsEngine;
    let object;
    let physics;
    let navigation;
    beforeEach(() => {
        physicsEngine = new PhysicsEngine();
        movementSystem = new MovementSystem(physicsEngine);
        object = new THREE.Object3D();
        physics = new PhysicsComponent();
        navigation = new NavigationComponent();
    });
    it('should not move if no target is set', () => {
        movementSystem.update(object, physics, navigation, 0.1);
        expect(physics.velocity.length()).toBe(0);
    });
    it('should accelerate towards the target', () => {
        // Set target 100 units forward (Z is -100)
        const target = new THREE.Vector3(0, 0, -100);
        navigation.setTarget(target);
        // Update
        movementSystem.update(object, physics, navigation, 0.1);
        // Should have some velocity
        expect(physics.velocity.length()).toBeGreaterThan(0);
        // Should be moving roughly towards -Z
        expect(physics.velocity.z).toBeLessThan(0);
    });
    it('should stop when close to target', () => {
        const target = new THREE.Vector3(0, 0, -100);
        navigation.setTarget(target);
        // Move object very close to target
        object.position.copy(target).add(new THREE.Vector3(0, 0, 0.5)); // 0.5 units away
        movementSystem.update(object, physics, navigation, 0.1);
        expect(navigation.state).toBe(NavigationState.ARRIVED);
        // Should apply brakes (drag)
        // We can't easily check "brakes applied" on physics engine without mocking, 
        // but we can check if velocity is dampened or zero if we run it enough.
    });
    it('should turn towards target', () => {
        // Target is to the right (X+)
        const target = new THREE.Vector3(100, 0, 0);
        navigation.setTarget(target);
        // Initial orientation is looking down -Z
        // Update
        movementSystem.update(object, physics, navigation, 0.1);
        // Should have angular velocity around Y (Yaw)
        // To turn right, we expect negative rotation around Y? 
        // Wait, Right Hand Rule: Thumb Y, Fingers curl X to Z. 
        // Positive rotation around Y turns -Z (Forward) to -X (Left).
        // So to turn Right (+X), we need Negative rotation around Y.
        // Let's check if angular velocity Y is not zero.
        expect(physics.angularVelocity.y).not.toBe(0);
    });
});
//# sourceMappingURL=MovementSystem.test.js.map