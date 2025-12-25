import { io, Socket } from 'socket.io-client';
import { decode } from '@msgpack/msgpack';
import { SnapshotInterpolator } from '../network/SnapshotInterpolator';
import { StateReconciler } from '../prediction/StateReconciler';
import { IGame } from '../scenes/BaseScene';

export class NetworkManager {
  private game: IGame;
  public socket: Socket;
  public playerEntityId: number | null = null;
  private interpolator: SnapshotInterpolator;
  private stateReconciler: StateReconciler;
  private metrics: any;
  private lastSnapshot: Map<number, any>;
  private pendingCommands: Map<string, any>;

  constructor(game: IGame) {
    this.game = game;
    this.socket = io('http://localhost:3001');
    this.interpolator = new SnapshotInterpolator(100);
    this.stateReconciler = new StateReconciler(this.game.world as any);

    this.metrics = {
      packetsReceived: 0,
      bytesReceived: 0,
      lastUpdate: Date.now(),
      commandConfirmations: 0,
      reconciliations: 0
    };

    this.lastSnapshot = new Map();
    this.pendingCommands = new Map();

    this.initSocketListeners();
  }

  private initSocketListeners(): void {
    this.socket.on('connect', () => console.log('✅ Connecté au serveur'));
    this.socket.on('disconnect', () => {
      console.warn('⚠️ Déconnecté du serveur');
      this.interpolator.clear();
    });

    this.socket.on('initWorld', (serverEntities: any[]) => {
      this.syncWorld(serverEntities);
    });

    this.socket.on('assignedEntity', ({ entityId, username }: { entityId: number; username: string }) => {
      this.playerEntityId = entityId;
      (this.game as any).playerEntity = entityId;
      (this.game as any).username = username;
      const playerDisplay = document.getElementById('player-name-display');
      if (playerDisplay) playerDisplay.textContent = username;
    });

    this.socket.on('worldDelta', (compressedData: Uint8Array) => {
      this.handleCompressedDelta(compressedData);
    });

    this.socket.on('commandConfirmation', (confirmation: any) => {
      if ((this.game as any).predictionEngine) {
        (this.game as any).predictionEngine.handleCommandConfirmation(confirmation);
      }
    });

    this.socket.on('serverSnapshot', (snapshotData: any) => {
      if ((this.game as any).predictionEngine) {
        (this.game as any).predictionEngine.reconcileWithServer(snapshotData);
      }
    });

    this.socket.on('entityMoved', ({ id, x, y, z }: any) => {
      const pos = this.game.world.getComponent<any>(id, 'Position');
      if (pos) {
        pos.x = x;
        pos.y = y;
        pos.z = z;
      }
    });
  }

  private handleCompressedDelta(compressedData: Uint8Array): void {
    try {
      const decodedData = decode(compressedData) as any;
      this.metrics.packetsReceived++;
      this.metrics.bytesReceived += compressedData.length;

      if (decodedData.type === 'full') {
        this.syncWorld(decodedData.data.entities);
      } else if (decodedData.type === 'delta') {
        this.applyDelta(decodedData.data.entities);
        for (const entity of decodedData.data.entities) {
          this.interpolator.addSnapshot(entity.id, entity, decodedData.timestamp);
        }
      }
      this.metrics.lastUpdate = Date.now();
    } catch (error) {
      console.error('❌ Erreur de désérialisation MessagePack:', error);
    }
  }

  update(): void {
    const interpolatedStates = this.interpolator.update(Date.now());
    for (const entityState of interpolatedStates) {
      const entityId = entityState.id;
      if (!(this.game.world as any).entities.has(entityId)) {
        this.game.world.createEntity(entityId);
      }
      if (entityState.components) {
        for (const [compName, compData] of Object.entries(entityState.components)) {
          this.game.world.addComponent(entityId, compName, compData);
        }
      }
    }
  }

  private syncWorld(serverEntities: any[]): void {
    for (const serverEntity of serverEntities) {
      const entityId = serverEntity.id;
      if (!(this.game.world as any).entities.has(entityId)) {
        this.game.world.createEntity(entityId);
      }
      if (serverEntity.components) {
        for (const [compName, compData] of Object.entries(serverEntity.components)) {
          this.game.world.addComponent(entityId, compName, compData);
        }
      }
      this.lastSnapshot.set(entityId, serverEntity);
    }
  }

  private applyDelta(delta: any[]): void {
    for (const serverEntity of delta) {
      const entityId = serverEntity.id;
      if (!(this.game.world as any).entities.has(entityId)) {
        this.game.world.createEntity(entityId);
      }
      for (const [compName, compData] of Object.entries(serverEntity.components)) {
        this.game.world.addComponent(entityId, compName, compData);
      }
      const existingSnapshot = this.lastSnapshot.get(entityId) || { id: entityId, components: {} };
      this.lastSnapshot.set(entityId, {
        ...existingSnapshot,
        components: { ...existingSnapshot.components, ...serverEntity.components }
      });
    }
  }

  switchScene(sceneName: string): void {
    this.socket.emit('switchScene', sceneName);
  }

  sendCommand(command: any): void {
    this.socket.emit('playerCommand', command);
  }

  requestPlacement(type: string, x: number, y: number, z: number, mode: string): void {
    this.socket.emit('requestPlacement', { type, x, y, z, mode, playerId: this.playerEntityId });
  }
}
