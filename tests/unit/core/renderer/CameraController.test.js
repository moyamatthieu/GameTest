import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { CameraController } from '../../../../src/core/renderer/CameraController';
import { CameraMode } from '../../../../src/core/renderer/types';
describe('CameraController', () => {
    let camera;
    let target;
    let controller;
    beforeEach(() => {
        camera = new THREE.PerspectiveCamera();
        target = new THREE.Object3D();
        controller = new CameraController(camera, target);
    });
    it('should initialize in CHASE mode', () => {
        expect(controller.getMode()).toBe(CameraMode.CHASE);
    });
    it('should cycle through modes', () => {
        expect(controller.getMode()).toBe(CameraMode.CHASE);
        controller.cycleMode();
        expect(controller.getMode()).toBe(CameraMode.COCKPIT);
        controller.cycleMode();
        expect(controller.getMode()).toBe(CameraMode.ORBIT);
        controller.cycleMode();
        expect(controller.getMode()).toBe(CameraMode.RTS);
    });
    it('should update camera position in CHASE mode', () => {
        target.position.set(0, 0, 0);
        target.quaternion.set(0, 0, 0, 1);
        // Force update with large deltaTime to reach target immediately (if lerp is 1)
        // Or just check if it moved towards the target offset.
        controller.update(1);
        // Default chase offset is usually behind and above.
        // Let's assume it's (0, 5, 10) relative to target.
        expect(camera.position.z).toBeGreaterThan(0);
        expect(camera.position.y).toBeGreaterThan(0);
    });
    it('should update camera position in COCKPIT mode', () => {
        controller.setMode(CameraMode.COCKPIT);
        target.position.set(10, 20, 30);
        target.quaternion.set(0, 0, 0, 1);
        controller.update(1);
        // Cockpit offset is (0, 0.5, -1)
        expect(camera.position.x).toBe(10);
        expect(camera.position.y).toBe(20.5);
        expect(camera.position.z).toBe(29);
    });
});
//# sourceMappingURL=CameraController.test.js.map