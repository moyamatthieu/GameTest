import { World } from '../ecs/World';

interface Deviation {
  type: string;
  entityId: number;
  severity: 'high' | 'medium' | 'low';
  local?: any;
  server?: any;
  deviation?: number;
  details?: any;
  description?: string;
}

interface Correction {
  type: string;
  entityId: number;
  correctState?: any;
  entityData?: any;
  deviation?: number;
  severity: string;
}

interface Interpolation {
  entityId: number;
  type: string;
  start: any;
  end: any;
  duration: number;
  startTime: number;
}

interface ReconciliationResult {
  needsCorrection: boolean;
  corrections: Correction[];
  interpolations: Interpolation[];
  deviations: Deviation[];
  timestamp: number;
}

export class StateReconciler {
  private world: World;
  private lastServerState: any | null = null;
  private correctionHistory: ReconciliationResult[] = [];
  private stats: any;
  private config: any;

  constructor(world: World) {
    this.world = world;
    this.stats = {
      totalReconciliations: 0,
      successfulReconciliations: 0,
      correctionsApplied: 0,
      rollbacks: 0,
      avgDeviation: 0,
      maxDeviation: 0
    };

    this.config = {
      maxHistorySize: 50,
      deviationThreshold: 0.1,
      interpolationEnabled: true,
      loggingEnabled: true,
      interpolationDuration: 500
    };
  }

  reconcile(localState: any, serverState: any): ReconciliationResult {
    this.stats.totalReconciliations++;

    const result: ReconciliationResult = {
      needsCorrection: false,
      corrections: [],
      interpolations: [],
      deviations: [],
      timestamp: Date.now()
    };

    if (!this.lastServerState) {
      this.lastServerState = serverState;
      this.stats.successfulReconciliations++;
      return result;
    }

    const comparison = this.compareStates(localState, serverState);

    if (comparison.hasDeviations) {
      result.needsCorrection = true;
      result.deviations = comparison.deviations;

      result.corrections = this.generateCorrections(comparison.deviations, localState, serverState);

      if (this.config.interpolationEnabled) {
        result.interpolations = this.generateInterpolations(result.corrections);
      }

      this.stats.correctionsApplied++;
      this.updateDeviationStats(comparison.deviations);

      if (this.config.loggingEnabled) {
        this.logReconciliation(result);
      }
    } else {
      this.stats.successfulReconciliations++;
    }

    this.lastServerState = serverState;
    this.addToHistory(result);

    return result;
  }

  private compareStates(localState: any, serverState: any): { hasDeviations: boolean; deviations: Deviation[] } {
    const deviations: Deviation[] = [];
    const localEntities = localState.entities || [];
    const serverEntities = serverState.entities || [];

    const localMap = new Map(localEntities.map((e: any) => [e.id, e]));
    const serverMap = new Map(serverEntities.map((e: any) => [e.id, e]));

    for (const [entityId, serverEntity] of serverMap) {
      const localEntity = localMap.get(entityId as number) as any;
      const sEntity = serverEntity as any;

      if (!localEntity) {
        deviations.push({
          type: 'missing_entity',
          entityId: entityId as number,
          severity: 'high',
          description: `Entité ${entityId} manquante localement`
        });
        continue;
      }

      if (this.hasPositionDeviation(localEntity, sEntity)) {
        const deviation = this.calculatePositionDeviation(localEntity, sEntity);
        if (deviation.magnitude > this.config.deviationThreshold) {
          deviations.push({
            type: 'position',
            entityId: entityId as number,
            severity: deviation.magnitude > 1 ? 'high' : 'medium',
            local: localEntity.position,
            server: sEntity.position,
            deviation: deviation.magnitude,
            details: deviation
          });
        }
      }
    }

    for (const [entityId] of localMap) {
      if (!serverMap.has(entityId)) {
        deviations.push({
          type: 'extra_entity',
          entityId: entityId as number,
          severity: 'high',
          description: `Entité ${entityId} existe localement mais pas sur le serveur`
        });
      }
    }

    return {
      hasDeviations: deviations.length > 0,
      deviations
    };
  }

  private hasPositionDeviation(localEntity: any, serverEntity: any): boolean {
    return (
      localEntity.position &&
      serverEntity.position &&
      (localEntity.position.x !== serverEntity.position.x ||
       localEntity.position.y !== serverEntity.position.y ||
       localEntity.position.z !== serverEntity.position.z)
    );
  }

  private calculatePositionDeviation(localEntity: any, serverEntity: any): any {
    const dx = serverEntity.position.x - localEntity.position.x;
    const dy = serverEntity.position.y - localEntity.position.y;
    const dz = (serverEntity.position.z || 0) - (localEntity.position.z || 0);
    const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return { magnitude, dx, dy, dz };
  }

  private generateCorrections(deviations: Deviation[], localState: any, serverState: any): Correction[] {
    const corrections: Correction[] = [];

    deviations.forEach(deviation => {
      switch (deviation.type) {
        case 'position':
          corrections.push({
            type: 'position',
            entityId: deviation.entityId,
            correctState: { position: { ...deviation.server } },
            deviation: deviation.deviation,
            severity: deviation.severity
          });
          break;
        case 'missing_entity':
          const serverEntity = serverState.entities.find((e: any) => e.id === deviation.entityId);
          if (serverEntity) {
            corrections.push({
              type: 'create_entity',
              entityId: deviation.entityId,
              entityData: serverEntity,
              severity: deviation.severity
            });
          }
          break;
        case 'extra_entity':
          corrections.push({
            type: 'remove_entity',
            entityId: deviation.entityId,
            severity: deviation.severity
          });
          break;
      }
    });

    return corrections;
  }

  private generateInterpolations(corrections: Correction[]): Interpolation[] {
    const interpolations: Interpolation[] = [];

    corrections.forEach(correction => {
      if (correction.type === 'position') {
        const entity = (this.world as any).getComponent(correction.entityId, 'Position');
        if (entity) {
          interpolations.push({
            entityId: correction.entityId,
            type: 'position',
            start: { ...entity },
            end: { ...correction.correctState.position },
            duration: this.config.interpolationDuration,
            startTime: Date.now()
          });
        }
      }
    });

    return interpolations;
  }

  applyInterpolations(interpolations: Interpolation[]): Interpolation[] {
    const now = Date.now();
    const activeInterpolations: Interpolation[] = [];

    interpolations.forEach(interp => {
      const elapsed = now - interp.startTime;
      const progress = Math.min(elapsed / interp.duration, 1);
      const smoothProgress = this.easeInOut(progress);

      const pos = (this.world as any).getComponent(interp.entityId, 'Position');
      if (pos) {
        pos.x = interp.start.x + (interp.end.x - interp.start.x) * smoothProgress;
        pos.y = interp.start.y + (interp.end.y - interp.start.y) * smoothProgress;
        pos.z = (interp.start.z || 0) + ((interp.end.z || 0) - (interp.start.z || 0)) * smoothProgress;
      }

      if (progress < 1) {
        activeInterpolations.push(interp);
      }
    });

    return activeInterpolations;
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private updateDeviationStats(deviations: Deviation[]): void {
    const positionDeviations = deviations
      .filter(d => d.type === 'position')
      .map(d => d.deviation || 0);

    if (positionDeviations.length > 0) {
      const avg = positionDeviations.reduce((a, b) => a + b, 0) / positionDeviations.length;
      const max = Math.max(...positionDeviations);

      this.stats.avgDeviation = (this.stats.avgDeviation * (this.stats.correctionsApplied - 1) + avg) / this.stats.correctionsApplied;
      this.stats.maxDeviation = Math.max(this.stats.maxDeviation, max);
    }
  }

  private logReconciliation(result: ReconciliationResult): void {
    console.log('[Reconciliation]', result);
  }

  private addToHistory(result: ReconciliationResult): void {
    this.correctionHistory.push(result);
    if (this.correctionHistory.length > this.config.maxHistorySize) {
      this.correctionHistory.shift();
    }
  }

  getStats(): any {
    const successRate = this.stats.totalReconciliations > 0
      ? (this.stats.successfulReconciliations / this.stats.totalReconciliations) * 100
      : 0;

    return {
      ...this.stats,
      successRate: successRate.toFixed(2),
      historySize: this.correctionHistory.length
    };
  }
}
