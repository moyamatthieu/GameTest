import { describe, it, expect } from 'vitest';
import { ResourceGenerator } from '../../../../src/core/world/ResourceGenerator';
import { ResourceType } from '../../../../src/core/economy/types';

describe('ResourceGenerator', () => {
  const resGen = new ResourceGenerator();

  it('should favor basic resources at the cluster center', () => {
    const centerPos = { x: 0, y: 0, z: 0 };
    const peripheryPos = { x: 600, y: 600, z: 0 };
    const clusterCoords = { x: 0, y: 0 };
    const seed = 'PLANET-1';

    const ironAtCenter = resGen.calculateDensity(ResourceType.IRON, clusterCoords, centerPos, seed);
    const ironAtPeriphery = resGen.calculateDensity(ResourceType.IRON, clusterCoords, peripheryPos, seed);

    expect(ironAtCenter).toBeGreaterThan(ironAtPeriphery);
  });

  it('should favor rare resources at the cluster periphery', () => {
    const centerPos = { x: 0, y: 0, z: 0 };
    const peripheryPos = { x: 600, y: 600, z: 0 };
    const clusterCoords = { x: 0, y: 0 };
    const seed = 'PLANET-1';

    const uraniumAtCenter = resGen.calculateDensity(ResourceType.URANIUM, clusterCoords, centerPos, seed);
    const uraniumAtPeriphery = resGen.calculateDensity(ResourceType.URANIUM, clusterCoords, peripheryPos, seed);

    expect(uraniumAtPeriphery).toBeGreaterThan(uraniumAtCenter);
  });
});
