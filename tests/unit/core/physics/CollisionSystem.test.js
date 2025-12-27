import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CollisionSystem } from '../../../../src/core/physics/CollisionSystem';
describe('CollisionSystem', () => {
    let system;
    let target;
    beforeEach(() => {
        system = new CollisionSystem();
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial();
        target = new THREE.Mesh(geometry, material);
        target.position.set(0, 0, -5);
        target.updateMatrixWorld();
    });
    it('should detect hit when ray intersects object', () => {
        const origin = new THREE.Vector3(0, 0, 0);
        const direction = new THREE.Vector3(0, 0, -1);
        const distance = 10;
        const hit = system.checkHit(origin, direction, distance, [target]);
        expect(hit).not.toBeNull();
        expect(hit?.object).toBe(target);
    });
    it('should not detect hit when ray is too short', () => {
        const origin = new THREE.Vector3(0, 0, 0);
        const direction = new THREE.Vector3(0, 0, -1);
        const distance = 2;
        const hit = system.checkHit(origin, direction, distance, [target]);
        expect(hit).toBeNull();
    });
    it('should not detect hit when ray points away', () => {
        const origin = new THREE.Vector3(0, 0, 0);
        const direction = new THREE.Vector3(0, 0, 1);
        const distance = 10;
        const hit = system.checkHit(origin, direction, distance, [target]);
        expect(hit).toBeNull();
    });
});
//# sourceMappingURL=CollisionSystem.test.js.map