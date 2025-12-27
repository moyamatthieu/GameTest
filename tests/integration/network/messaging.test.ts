import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PeerService } from '../../../src/core/network/PeerService';
import { ConnectionManager } from '../../../src/core/network/ConnectionManager';
import { MessageType } from '../../../src/core/network/contracts';

// Mock PeerJS
vi.mock('peerjs', () => {
  class DataConnectionMock {
    on = vi.fn();
    send = vi.fn();
    open = true;
    peer = 'mock-peer-id';
  }

  const PeerMock = vi.fn().mockImplementation(function(id) {
    return {
      on: vi.fn(),
      connect: vi.fn().mockReturnValue(new DataConnectionMock()),
      destroy: vi.fn(),
      id: id
    };
  });
  return {
    default: PeerMock,
    Peer: PeerMock,
    DataConnection: DataConnectionMock
  };
});

describe('Message Exchange Integration', () => {
  let peerService: PeerService;
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    peerService = new PeerService('test-peer');
    connectionManager = new ConnectionManager();
  });

  it('should send and receive chat messages', () => {
    const messages: any[] = [];
    connectionManager.onMessage((msg) => messages.push(msg));

    // Simulate connection
    const mockConn = { peer: 'other-peer', on: vi.fn(), send: vi.fn(), open: true };
    connectionManager.addConnection(mockConn as any);

    // Simulate receiving a message
    const testMessage = {
      type: MessageType.CHAT,
      payload: { text: 'Hello' },
      timestamp: Date.now(),
      senderId: 'other-peer'
    };

    // Trigger data event
    mockConn.on.mock.calls.find(call => call[0] === 'data')[1](testMessage);

    expect(messages).toHaveLength(1);
    expect(messages[0].payload.text).toBe('Hello');
  });
});
