import { describe, it, expect } from 'vitest';
import { Starfield } from '../../../../src/core/renderer/Starfield';
import * as THREE from 'three';

describe('Starfield', () => {
  it('should create a Points object with the specified count', () => {
    const count = 500;
    const starfield = new Starfield(count);
    const mesh = starfield.getMesh();

    expect(mesh).toBeInstanceOf(THREE.Points);
    expect(mesh.geometry.attributes.position.count).toBe(count);
  });

  it('should create a Points object with default count', () => {
    const starfield = new Starfield();
    const mesh = starfield.getMesh();

    expect(mesh).toBeInstanceOf(THREE.Points);
    expect(mesh.geometry.attributes.position.count).toBe(1000);
  });

  it('should have white color and small size', () => {
    const starfield = new Starfield(100);
    const mesh = starfield.getMesh();

    expect(mesh.material.color.getHex()).toBe(0xffffff);
    expect(mesh.material.size).toBe(0.1);
  });
});
