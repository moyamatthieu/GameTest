import { jest } from '@jest/globals';
import { NetworkProtocol } from '../../../server/network/Protocol';

describe('NetworkProtocol', () => {
  let protocol: NetworkProtocol;

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
  });

  describe('Delta Compression', () => {
    test('should create full snapshot for first update', () => {
      const playerId = 'player1';
      const snapshot = {
        entities: [{ id: 1, x: 100, y: 200 }],
        players: [{ id: playerId, name: 'Test' }]
      };

      const delta = protocol.createDeltaSnapshot(playerId, snapshot);
      const decoded = protocol.decodeSnapshot(delta!);

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
        entities: [{ id: 1, x: 110, y: 210 }],
        players: [{ id: playerId, name: 'Test' }]
      };

      protocol.createDeltaSnapshot(playerId, snapshot1);
      const delta = protocol.createDeltaSnapshot(playerId, snapshot2);
      const decoded = protocol.decodeSnapshot(delta!);

      expect(decoded.type).toBe('delta');
      expect(decoded.data.entities).toBeDefined();
      expect(decoded.data.players).toBeUndefined();
    });
  });
});
