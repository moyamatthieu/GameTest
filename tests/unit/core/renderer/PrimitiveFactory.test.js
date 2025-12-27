import { describe, it, expect } from 'vitest';
import { PrimitiveFactory } from '../../../../src/core/renderer/PrimitiveFactory';
import * as THREE from 'three';
describe('PrimitiveFactory', () => {
    const factory = new PrimitiveFactory();
    it('should create a box mesh', () => {
        const mesh = factory.createBox(1, 1, 1, 0xff0000);
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    });
    it('should create a ship group', () => {
        const ship = factory.createShip();
        expect(ship).toBeInstanceOf(THREE.Group);
        expect(ship.name).toBe('modular-ship');
        expect(ship.children.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=PrimitiveFactory.test.js.map