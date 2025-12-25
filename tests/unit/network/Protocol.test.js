import { jest } from '@jest/globals';
import { NetworkProtocol } from '../../../server/network/Protocol.js';

describe('NetworkProtocol', () => {
  let protocol;

  beforeEach(() => {
    protocol = new NetworkProtocol();
  });

  describe('MessagePack Serialization', () => {
    test('should encode and decode simple objects', () => {
      const data = {
        players: [{ id: 1, x: 100, y: 200 }],
        entities: [{ id: 2, type: 'ship' }]
      };

      const encoded = protocol.encodeSnapshot(data);
      const decoded = protocol.decodeSnapshot(encoded);

      expect(decoded).toEqual(data);
      expect(encoded).toBeInstanceOf(Uint8Array);
    });

    test('should handle complex nested structures', () => {
      const data = {
        timestamp: Date.now(),
        world: {
          entities: [
            { id: 1, position: { x: 10, y: 20, z: 30 }, components: ['Position', 'Velocity'] },
            { id: 2, position: { x: 40, y: 50, z: 60 }, components: ['Position', 'Building'] }
          ],
          economy: {
            metal: 1000,
            energy: 500,
            credits: 200
          }
        }
      };

      const encoded = protocol.encodeSnapshot(data);
      const decoded = protocol.decodeSnapshot(encoded);

      expect(decoded).toEqual(data);
    });

    test('should track serialization metrics', () => {
      const data = { test: 'data' };

      protocol.encodeSnapshot(data);
      protocol.decodeSnapshot(protocol.encodeSnapshot(data));

      const metrics = protocol.getMetrics();

      expect(metrics.packetsSent).toBe(2);
      expect(metrics.packetsReceived).toBe(1);
      expect(metrics.totalBytesSent).toBeGreaterThan(0);
      expect(metrics.totalBytesReceived).toBeGreaterThan(0);
    });
  });

  describe('Delta Compression', () => {
    test('should create full snapshot for first update', () => {
      const playerId = 'player1';
      const snapshot = {
        entities: [{ id: 1, x: 100, y: 200 }],
        players: [{ id: playerId, name: 'Test' }]
      };

      const delta = protocol.createDeltaSnapshot(playerId, snapshot);
      const decoded = protocol.decodeSnapshot(delta);

      expect(decoded.type).toBe('full');
      expect(decoded.data).toEqual(snapshot);
    });

    test('should create delta snapshot for subsequent updates', () => {
      const playerId = 'player1';
      const snapshot1 = {
        entities: [{ id: 1, x: 100, y: 200 }],
        players: [{ id: playerId, name: 'Test' }]
      };

      const snapshot2 = {
        entities: [{ id: 1, x: 110, y: 210 }], // Position changed
        players: [{ id: playerId, name: 'Test' }]
      };

      // First snapshot (full)
      protocol.createDeltaSnapshot(playerId, snapshot1);

      // Second snapshot (delta)
      const delta = protocol.createDeltaSnapshot(playerId, snapshot2);
      const decoded = protocol.decodeSnapshot(delta);

      expect(decoded.type).toBe('delta');
      expect(decoded.data.entities).toBeDefined();
      expect(decoded.data.players).toBeUndefined(); // Should not include unchanged data
    });

    test('should return null when no changes detected', () => {
      const playerId = 'player1';
      const snapshot = {
        entities: [{ id: 1, x: 100, y: 200 }],
        players: [{ id: playerId, name: 'Test' }]
      };

      // First snapshot
      protocol.createDeltaSnapshot(playerId, snapshot);

      // Identical snapshot
      const delta = protocol.createDeltaSnapshot(playerId, snapshot);

      expect(delta).toBeNull();
    });

    test('should calculate delta correctly for primitive values', () => {
      const oldObj = { a: 1, b: 2, c: 3 };
      const newObj = { a: 1, b: 5, c: 3 }; // Only b changed

      const delta = protocol.calculateDelta(oldObj, newObj);

      expect(delta).toEqual({ b: 5 });
      expect(delta.a).toBeUndefined();
      expect(delta.c).toBeUndefined();
    });

    test('should calculate delta for nested objects', () => {
      const oldObj = {
        position: { x: 10, y: 20 },
        stats: { hp: 100, shield: 50 }
      };
      const newObj = {
        position: { x: 15, y: 20 }, // x changed
        stats: { hp: 100, shield: 50 }
      };

      const delta = protocol.calculateDelta(oldObj, newObj);

      expect(delta.position).toEqual({ x: 15, y: 20 });
      expect(delta.stats).toBeUndefined();
    });

    test('should calculate delta for arrays', () => {
      const oldObj = {
        entities: [{ id: 1 }, { id: 2 }]
      };
      const newObj = {
        entities: [{ id: 1 }, { id: 2 }, { id: 3 }] // Added entity
      };

      const delta = protocol.calculateDelta(oldObj, newObj);

      expect(delta.entities).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    test('should not include unchanged arrays in delta', () => {
      const oldObj = {
        entities: [{ id: 1 }, { id: 2 }]
      };
      const newObj = {
        entities: [{ id: 1 }, { id: 2 }] // Same array
      };

      const delta = protocol.calculateDelta(oldObj, newObj);

      expect(delta.entities).toBeUndefined();
    });
  });

  describe('Delta Application', () => {
    test('should apply delta to base snapshot', () => {
      const base = {
        entities: [{ id: 1, x: 100, y: 200 }],
        players: [{ id: 'p1', name: 'Player' }],
        resources: { metal: 100, energy: 50 }
      };

      const delta = {
        entities: [{ id: 1, x: 150, y: 250 }],
        resources: { metal: 120 }
      };

      const result = protocol.applyDelta(base, delta);

      expect(result.entities[0].x).toBe(150);
      expect(result.entities[0].y).toBe(250);
      expect(result.players[0].name).toBe('Player'); // Unchanged
      expect(result.resources.metal).toBe(120);
      expect(result.resources.energy).toBe(50);
    });

    test('should handle complete snapshot updates', () => {
      const base = {
        entities: [{ id: 1, x: 100 }],
        timestamp: 1000
      };

      const delta = {
        entities: [{ id: 1, x: 200 }],
        timestamp: 2000,
        newField: 'added'
      };

      const result = protocol.applyDelta(base, delta);

      expect(result.entities[0].x).toBe(200);
      expect(result.timestamp).toBe(2000);
      expect(result.newField).toBe('added');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large snapshot serialization efficiently', () => {
      const largeSnapshot = {
        entities: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          position: { x: Math.random() * 1000, y: Math.random() * 1000, z: Math.random() * 1000 },
          velocity: { vx: Math.random() * 10, vy: Math.random() * 10, vz: Math.random() * 10 },
          components: ['Position', 'Velocity', 'Identity']
        })),
        players: Array.from({ length: 100 }, (_, i) => ({
          id: `player${i}`,
          name: `Player ${i}`,
          position: { x: Math.random() * 1000, y: Math.random() * 1000 }
        }))
      };

      const start = performance.now();
      const encoded = protocol.encodeSnapshot(largeSnapshot);
      const encodeTime = performance.now() - start;

      const startDecode = performance.now();
      const decoded = protocol.decodeSnapshot(encoded);
      const decodeTime = performance.now() - startDecode;

      expect(encodeTime).toBeLessThan(100); // Should encode in < 100ms
      expect(decodeTime).toBeLessThan(50); // Should decode in < 50ms
      expect(decoded.entities.length).toBe(1000);
      expect(decoded.players.length).toBe(100);
    });

    test('should achieve good compression ratio with delta encoding', () => {
      const playerId = 'player1';

      // Initial snapshot
      const snapshot1 = {
        entities: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          x: i * 10,
          y: i * 20
        })),
        timestamp: 1000
      };

      // Small change
      const snapshot2 = {
        entities: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          x: i * 10,
          y: i * 20
        })),
        timestamp: 2000
      };
      snapshot2.entities[50].x += 5; // Only one entity changed

      const full1 = protocol.createDeltaSnapshot(playerId, snapshot1);
      const delta = protocol.createDeltaSnapshot(playerId, snapshot2);

      const fullSize = protocol.encodeSnapshot(snapshot2).length;
      const deltaSize = delta.length;

      // Delta should be much smaller than full snapshot
      expect(deltaSize).toBeLessThan(fullSize * 0.5); // At least 50% smaller
    });

    test('should handle rapid sequential updates', () => {
      const playerId = 'player1';
      const baseSnapshot = {
        entities: [{ id: 1, x: 100, y: 200 }],
        timestamp: 0
      };

      const start = performance.now();

      // Simulate 100 rapid updates
      for (let i = 0; i < 100; i++) {
        const snapshot = {
          entities: [{ id: 1, x: 100 + i, y: 200 + i }],
          timestamp: i
        };
        protocol.createDeltaSnapshot(playerId, snapshot);
      }

      const totalTime = performance.now() - start;

      expect(totalTime).toBeLessThan(500); // Should handle 100 updates in < 500ms
    });
  });

  describe('Metrics Collection', () => {
    test('should calculate compression ratio correctly', () => {
      const playerId = 'player1';

      const snapshot1 = {
        entities: Array.from({ length: 50 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
      };

      const snapshot2 = {
        entities: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          data: i === 25 ? 'y'.repeat(100) : 'x'.repeat(100) // Only one change
        }))
      };

      protocol.createDeltaSnapshot(playerId, snapshot1);
      protocol.createDeltaSnapshot(playerId, snapshot2);

      const metrics = protocol.getMetrics();

      expect(metrics.compressionRatio).toBeDefined();
      expect(metrics.bytesSaved).toBeGreaterThan(0);
      expect(metrics.averagePacketSize).toBeGreaterThan(0);
    });

    test('should reset metrics correctly', () => {
      const data = { test: 'data' };
      protocol.encodeSnapshot(data);

      const metricsBefore = protocol.getMetrics();
      expect(metricsBefore.packetsSent).toBe(1);

      protocol.resetMetrics();

      const metricsAfter = protocol.getMetrics();
      expect(metricsAfter.packetsSent).toBe(0);
      expect(metricsAfter.totalBytesSent).toBe(0);
    });
  });

  describe('Player Management', () => {
    test('should clear player snapshots', () => {
      const playerId = 'player1';
      const snapshot = { entities: [] };

      protocol.createDeltaSnapshot(playerId, snapshot);
      expect(protocol.lastSnapshots.has(playerId)).toBe(true);

      protocol.clearPlayer(playerId);
      expect(protocol.lastSnapshots.has(playerId)).toBe(false);
    });

    test('should handle multiple players independently', () => {
      const player1 = 'player1';
      const player2 = 'player2';

      const snapshot1 = { entities: [{ id: 1, owner: player1 }] };
      const snapshot2 = { entities: [{ id: 2, owner: player2 }] };

      protocol.createDeltaSnapshot(player1, snapshot1);
      protocol.createDeltaSnapshot(player2, snapshot2);

      expect(protocol.lastSnapshots.has(player1)).toBe(true);
      expect(protocol.lastSnapshots.has(player2)).toBe(true);

      protocol.clearPlayer(player1);
      expect(protocol.lastSnapshots.has(player1)).toBe(false);
      expect(protocol.lastSnapshots.has(player2)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty objects', () => {
      const data = {};
      const encoded = protocol.encodeSnapshot(data);
      const decoded = protocol.decodeSnapshot(encoded);
      expect(decoded).toEqual({});
    });

    test('should handle null and undefined values', () => {
      const data = { a: null, b: undefined, c: 0 };
      const encoded = protocol.encodeSnapshot(data);
      const decoded = protocol.decodeSnapshot(encoded);
      expect(decoded.a).toBeNull();
      expect(decoded.c).toBe(0);
    });

    test('should handle very large numbers', () => {
      const data = {
        large: Number.MAX_SAFE_INTEGER,
        small: Number.MIN_SAFE_INTEGER,
        float: Math.PI
      };

      const encoded = protocol.encodeSnapshot(data);
      const decoded = protocol.decodeSnapshot(encoded);

      expect(decoded.large).toBe(Number.MAX_SAFE_INTEGER);
      expect(decoded.small).toBe(Number.MIN_SAFE_INTEGER);
      expect(decoded.float).toBeCloseTo(Math.PI, 10);
    });
  });
});
