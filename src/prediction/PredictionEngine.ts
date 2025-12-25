import { CommandBuffer, Command } from './CommandBuffer';
import { StateReconciler } from './StateReconciler';
import { World } from '../ecs/World';

export class PredictionEngine {
  private world: World;
  private networkManager: any;
  private commandBuffer: CommandBuffer;
  private reconciler: StateReconciler;
  private pendingCommands: Map<string, Command>;
  private lastProcessedTick: number;
  private commandCounter: number;
  private stats: any;

  constructor(world: World, networkManager: any) {
    this.world = world;
    this.networkManager = networkManager;
    this.commandBuffer = new CommandBuffer();
    this.reconciler = new StateReconciler(world);
    this.pendingCommands = new Map();
    this.lastProcessedTick = 0;
    this.commandCounter = 0;

    this.stats = {
      totalPredictions: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      rollbacks: 0,
      avgLatency: 0
    };
  }

  predictAction(type: string, data: any, entity: any = null): string {
    const commandId = this.generateCommandId();
    const timestamp = Date.now();

    const stateBefore = this.saveRelevantState(entity);

    const command: Command = {
      id: commandId,
      type,
      data,
      entityId: entity?.id || null,
      timestamp,
      stateBefore,
      status: 'pending',
      tick: this.lastProcessedTick
    };

    this.applyPrediction(command);
    this.commandBuffer.add(command);
    this.pendingCommands.set(commandId, command);
    this.networkManager.sendCommand(command);

    this.stats.totalPredictions++;
    return commandId;
  }

  private applyPrediction(command: Command): void {
    const { type, data } = command;
    switch (type) {
      case 'MOVE_FLEET': this.predictFleetMovement(data); break;
      case 'BUILD_BUILDING': this.predictBuildingConstruction(data); break;
      case 'TRANSFER_RESOURCES': this.predictResourceTransfer(data); break;
    }
  }

  private predictFleetMovement(data: any): void {
    const fleet = (this.world as any).getEntity(data.fleetId);
    if (fleet && fleet.position) {
      fleet.position.target = data.targetPosition;
      fleet.position.path = data.path;
    }
  }

  private predictBuildingConstruction(data: any): void {
    const planet = (this.world as any).getEntity(data.planetId);
    if (planet && planet.buildings) {
      if (!planet.buildings.pending) planet.buildings.pending = [];
      planet.buildings.pending.push({
        id: `pending_${Date.now()}`,
        type: data.buildingType,
        position: data.position,
        constructionProgress: 0,
        isConstructing: true
      });
    }
  }

  private predictResourceTransfer(data: any): void {
    const fromPlanet = (this.world as any).getEntity(data.fromPlanetId);
    const toPlanet = (this.world as any).getEntity(data.toPlanetId);
    if (fromPlanet && toPlanet) {
      Object.keys(data.resources).forEach(resource => {
        if (fromPlanet.resources[resource] !== undefined) fromPlanet.resources[resource] -= data.resources[resource];
        if (toPlanet.resources[resource] !== undefined) toPlanet.resources[resource] += data.resources[resource];
      });
    }
  }

  handleCommandConfirmation(serverCommand: any): void {
    const { id, confirmed, tick } = serverCommand;
    const pendingCommand = this.pendingCommands.get(id);

    if (!pendingCommand) return;

    if (confirmed) {
      pendingCommand.status = 'confirmed';
      pendingCommand.confirmedTick = tick;
      this.stats.successfulPredictions++;
      this.updateAverageLatency(Date.now() - pendingCommand.timestamp);
    } else {
      pendingCommand.status = 'rejected';
      this.rollbackCommand(pendingCommand);
      this.stats.failedPredictions++;
    }

    this.cleanupCommand(id);
  }

  reconcileWithServer(serverState: any): any {
    const localState = this.getCurrentState();
    const reconciliation = this.reconciler.reconcile(localState, serverState);

    if (reconciliation.needsCorrection) {
      this.stats.rollbacks++;
      this.applyCorrections(reconciliation.corrections);
      this.reapplyPendingCommands();
    }

    return reconciliation;
  }

  private applyCorrections(corrections: any[]): void {
    corrections.forEach(correction => {
      const entity = (this.world as any).getEntity(correction.entityId);
      if (entity) Object.assign(entity, correction.correctState);
    });
  }

  private reapplyPendingCommands(): void {
    this.pendingCommands.forEach(command => {
      if (command.status === 'pending') this.applyPrediction(command);
    });
  }

  private rollbackCommand(command: Command): void {
    if (command.stateBefore) {
      const entity = (this.world as any).getEntity(command.stateBefore.entityId);
      if (entity) Object.assign(entity, command.stateBefore.components);
    }
  }

  private generateCommandId(): string {
    return `cmd_${this.commandCounter++}_${Date.now()}`;
  }

  private saveRelevantState(entity: any): any {
    if (!entity) return null;
    const state: any = { entityId: entity.id, components: {} };
    if (entity.position) state.components.position = { ...entity.position };
    if (entity.resources) state.components.resources = { ...entity.resources };
    return state;
  }

  private getCurrentState(): any {
    const entities = (this.world as any).getEntities();
    return {
      timestamp: Date.now(),
      tick: this.lastProcessedTick,
      entities: entities.map((e: any) => ({
        id: e.id,
        position: e.position,
        resources: e.resources,
        buildings: e.buildings
      }))
    };
  }

  private updateAverageLatency(latency: number): void {
    const total = this.stats.successfulPredictions;
    this.stats.avgLatency = ((this.stats.avgLatency * (total - 1)) + latency) / total;
  }

  private cleanupCommand(commandId: string): void {
    this.pendingCommands.delete(commandId);
    this.commandBuffer.remove(commandId);
  }

  update(deltaTime: number): void {
    this.commandBuffer.cleanupExpired();
    this.lastProcessedTick++;
  }

  getStats(): any {
    const successRate = this.stats.totalPredictions > 0
      ? (this.stats.successfulPredictions / this.stats.totalPredictions) * 100
      : 0;
    return {
      ...this.stats,
      successRate: successRate.toFixed(2),
      pendingCommands: this.pendingCommands.size
    };
  }
}
