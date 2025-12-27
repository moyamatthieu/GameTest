import * as THREE from 'three';
import { PeerService } from '../network/PeerService';
import { ConnectionManager } from '../network/ConnectionManager';
import { RemotePlayerManager } from './RemotePlayerManager';
import { MessageType, StateUpdatePayload, FireLaserPayload, HitTargetPayload } from '../network/contracts';

export class SyncService {
  private peerService: PeerService;
  private connectionManager: ConnectionManager;
  private remotePlayerManager: RemotePlayerManager;
  private localShip: THREE.Object3D;
  private peerId: string;

  private onFireLaserCallback?: (payload: FireLaserPayload, senderId: string) => void;
  private onHitTargetCallback?: (payload: HitTargetPayload, senderId: string) => void;

  constructor(
    peerId: string,
    peerService: PeerService,
    connectionManager: ConnectionManager,
    remotePlayerManager: RemotePlayerManager,
    localShip: THREE.Object3D
  ) {
    this.peerId = peerId;
    this.peerService = peerService;
    this.connectionManager = connectionManager;
    this.remotePlayerManager = remotePlayerManager;
    this.localShip = localShip;

    this.setupMessageHandling();
    this.setupDisconnectHandling();
  }

  public onFireLaser(callback: (payload: FireLaserPayload, senderId: string) => void) {
    this.onFireLaserCallback = callback;
  }

  public onHitTarget(callback: (payload: HitTargetPayload, senderId: string) => void) {
    this.onHitTargetCallback = callback;
  }

  private setupMessageHandling() {
    this.connectionManager.onMessage((message) => {
      switch (message.type) {
        case MessageType.STATE_UPDATE:
          this.remotePlayerManager.updatePlayerState(
            message.senderId,
            message.payload as StateUpdatePayload
          );
          break;
        case MessageType.FIRE_LASER:
          this.onFireLaserCallback?.(message.payload as FireLaserPayload, message.senderId);
          break;
        case MessageType.HIT_TARGET:
          this.onHitTargetCallback?.(message.payload as HitTargetPayload, message.senderId);
          break;
      }
    });
  }

  private setupDisconnectHandling() {
    this.connectionManager.onDisconnect((peerId) => {
      this.remotePlayerManager.removePlayer(peerId);
    });
  }

  public broadcastFireLaser(payload: FireLaserPayload): void {
    this.broadcast(MessageType.FIRE_LASER, payload);
  }

  public broadcastHitTarget(payload: HitTargetPayload): void {
    this.broadcast(MessageType.HIT_TARGET, payload);
  }

  private broadcast(type: MessageType, payload: any): void {
    const connections = this.connectionManager.getConnections();
    if (connections.length === 0) return;

    const message = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: this.peerId,
    };

    connections.forEach((conn) => {
      this.peerService.sendMessage(conn.remotePeerId, message);
    });
  }

  public broadcastLocalState(): void {
    const payload: StateUpdatePayload = {
      position: {
        x: this.localShip.position.x,
        y: this.localShip.position.y,
        z: this.localShip.position.z,
      },
      rotation: {
        x: this.localShip.quaternion.x,
        y: this.localShip.quaternion.y,
        z: this.localShip.quaternion.z,
        w: this.localShip.quaternion.w,
      },
    };

    this.broadcast(MessageType.STATE_UPDATE, payload);
  }

  public update(): void {
    this.remotePlayerManager.cleanup();
  }
}
