import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PeerService } from '../../../src/core/network/PeerService';

// Mock PeerJS
vi.mock('peerjs', () => {
  const PeerMock = vi.fn().mockImplementation(function(id) {
    return {
      on: vi.fn(),
      connect: vi.fn(),
      destroy: vi.fn(),
      id: id
    };
  });
  return {
    default: PeerMock,
    Peer: PeerMock
  };
});

describe('PeerService', () => {
  it('should initialize with a peerId', () => {
    const peerService = new PeerService('test-id');
    expect(peerService).toBeDefined();
  });
});
