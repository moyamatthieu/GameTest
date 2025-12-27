import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SyncService } from './SyncService';
import { MessageType } from '../network/contracts';

describe('SyncService', () => {
  let peerService: any;
  let connectionManager: any;
  let remotePlayerManager: any;
  let localShip: THREE.Object3D;
  let syncService: SyncService;
  const peerId = 'local-peer';

  beforeEach(() => {
    peerService = {
      sendMessage: vi.fn(),
    };
    connectionManager = {
      getConnections: vi.fn().mockReturnValue([]),
      onMessage: vi.fn(),
      onDisconnect: vi.fn(),
    };
    remotePlayerManager = {
      updatePlayerState: vi.fn(),
      removePlayer: vi.fn(),
      cleanup: vi.fn(),
    };
    localShip = new THREE.Object3D();
    syncService = new SyncService(
      peerId,
      peerService,
      connectionManager,
      remotePlayerManager,
      localShip
    );
  });

  it('should broadcast local state to all connections', () => {
    const mockConnections = [
      { remotePeerId: 'peer-1' },
      { remotePeerId: 'peer-2' },
    ];
    connectionManager.getConnections.mockReturnValue(mockConnections);

    localShip.position.set(1, 2, 3);
    localShip.quaternion.set(0, 0, 0, 1);

    syncService.broadcastLocalState();

    expect(peerService.sendMessage).toHaveBeenCalledTimes(2);
    expect(peerService.sendMessage).toHaveBeenCalledWith('peer-1', expect.objectContaining({
      type: MessageType.STATE_UPDATE,
      payload: {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      senderId: peerId,
    }));
  });

  it('should handle incoming state updates', () => {
    // Get the callback passed to onMessage
    const onMessageCallback = connectionManager.onMessage.mock.calls[0][0];

    const remotePeerId = 'remote-peer';
    const payload = {
      position: { x: 10, y: 20, z: 30 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };

    onMessageCallback({
      type: MessageType.STATE_UPDATE,
      senderId: remotePeerId,
      payload,
    });

    expect(remotePlayerManager.updatePlayerState).toHaveBeenCalledWith(remotePeerId, payload);
  });

  it('should handle peer disconnection', () => {
    const onDisconnectCallback = connectionManager.onDisconnect.mock.calls[0][0];
    const remotePeerId = 'remote-peer';

    onDisconnectCallback(remotePeerId);

    expect(remotePlayerManager.removePlayer).toHaveBeenCalledWith(remotePeerId);
  });
});
