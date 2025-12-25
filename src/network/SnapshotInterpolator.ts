interface Snapshot {
  data: any;
  timestamp: number;
  receivedAt: number;
}

interface InterpolatorMetrics {
  snapshotsReceived: number;
  snapshotsDropped: number;
  interpolationCount: number;
  averageLatency: number;
}

/**
 * Snapshot Interpolator
 * Lisse les mouvements en interpolant entre les snapshots reçus du serveur
 */
export class SnapshotInterpolator {
  private interpolationDelay: number;
  private snapshots: Map<number, Snapshot[]>;
  private currentStates: Map<number, any>;
  private lastUpdateTime: number;
  private metrics: InterpolatorMetrics;

  constructor(interpolationDelay = 100) {
    this.interpolationDelay = interpolationDelay;
    this.snapshots = new Map();
    this.currentStates = new Map();
    this.lastUpdateTime = Date.now();

    this.metrics = {
      snapshotsReceived: 0,
      snapshotsDropped: 0,
      interpolationCount: 0,
      averageLatency: 0
    };
  }

  addSnapshot(entityId: number, snapshot: any, timestamp: number): void {
    this.metrics.snapshotsReceived++;

    if (!this.snapshots.has(entityId)) {
      this.snapshots.set(entityId, []);
    }

    const entitySnapshots = this.snapshots.get(entityId)!;

    entitySnapshots.push({
      data: snapshot,
      timestamp: timestamp,
      receivedAt: Date.now()
    });

    while (entitySnapshots.length > 5) {
      entitySnapshots.shift();
      this.metrics.snapshotsDropped++;
    }

    entitySnapshots.sort((a, b) => a.timestamp - b.timestamp);
  }

  update(currentTime = Date.now()): any[] {
    const interpolatedStates: any[] = [];
    this.lastUpdateTime = currentTime;

    const interpolationTime = currentTime - this.interpolationDelay;

    for (const [entityId, snapshots] of this.snapshots) {
      if (snapshots.length < 2) {
        if (snapshots.length === 1) {
          this.currentStates.set(entityId, snapshots[0].data);
          interpolatedStates.push({
            id: entityId,
            ...snapshots[0].data
          });
        }
        continue;
      }

      let olderSnapshot: Snapshot | null = null;
      let newerSnapshot: Snapshot | null = null;

      for (let i = 0; i < snapshots.length - 1; i++) {
        if (snapshots[i].timestamp <= interpolationTime &&
            snapshots[i + 1].timestamp >= interpolationTime) {
          olderSnapshot = snapshots[i];
          newerSnapshot = snapshots[i + 1];
          break;
        }
      }

      if (!olderSnapshot || !newerSnapshot) {
        const latestSnapshot = snapshots[snapshots.length - 1];
        this.currentStates.set(entityId, latestSnapshot.data);
        interpolatedStates.push({
          id: entityId,
          ...latestSnapshot.data
        });
        continue;
      }

      const timeRange = newerSnapshot.timestamp - olderSnapshot.timestamp;
      const timeOffset = interpolationTime - olderSnapshot.timestamp;
      const t = timeRange > 0 ? timeOffset / timeRange : 0;

      const interpolatedState = this.interpolateData(
        olderSnapshot.data,
        newerSnapshot.data,
        t
      );

      this.currentStates.set(entityId, interpolatedState);
      interpolatedStates.push({
        id: entityId,
        ...interpolatedState
      });

      this.metrics.interpolationCount++;

      const latency = currentTime - newerSnapshot.receivedAt;
      this.metrics.averageLatency = (this.metrics.averageLatency * 0.9) + (latency * 0.1);
    }

    return interpolatedStates;
  }

  private interpolateData(oldState: any, newState: any, t: number): any {
    const result: any = {};

    for (const key in newState) {
      if (typeof newState[key] === 'object' && newState[key] !== null) {
        if (Array.isArray(newState[key])) {
          result[key] = this.interpolateArray(oldState[key] || [], newState[key], t);
        } else {
          result[key] = this.interpolateData(oldState[key] || {}, newState[key], t);
        }
      } else if (typeof newState[key] === 'number') {
        const oldValue = oldState[key] || 0;
        result[key] = oldValue + (newState[key] - oldValue) * t;
      } else {
        result[key] = newState[key];
      }
    }

    return result;
  }

  private interpolateArray(oldArray: any[], newArray: any[], t: number): any[] {
    const result: any[] = [];
    const maxLength = Math.max(oldArray.length, newArray.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < newArray.length) {
        if (typeof newArray[i] === 'number' && i < oldArray.length) {
          result[i] = oldArray[i] + (newArray[i] - oldArray[i]) * t;
        } else {
          result[i] = newArray[i];
        }
      }
    }

    return result;
  }

  getEntityState(entityId: number): any {
    return this.currentStates.get(entityId) || null;
  }

  getAllStates(): any[] {
    const states: any[] = [];
    for (const [entityId, state] of this.currentStates) {
      states.push({
        id: entityId,
        ...state
      });
    }
    return states;
  }

  removeEntity(entityId: number): void {
    this.snapshots.delete(entityId);
    this.currentStates.delete(entityId);
  }

  clear(): void {
    this.snapshots.clear();
    this.currentStates.clear();
    this.metrics = {
      snapshotsReceived: 0,
      snapshotsDropped: 0,
      interpolationCount: 0,
      averageLatency: 0
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageLatency: this.metrics.averageLatency.toFixed(2) + 'ms',
      activeEntities: this.snapshots.size
    };
  }

  setInterpolationDelay(delay: number): void {
    this.interpolationDelay = delay;
  }
}
