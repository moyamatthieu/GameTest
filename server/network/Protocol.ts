import { encode, decode } from '@msgpack/msgpack';

interface NetworkMetrics {
  totalBytesSent: number;
  totalBytesReceived: number;
  packetsSent: number;
  packetsReceived: number;
  bytesSaved: number;
}

/**
 * Protocol de sérialisation binaire optimisé pour le jeu
 * Utilise MessagePack + Delta Compression pour réduire la bande passante
 */
export class NetworkProtocol {
  private lastSnapshots: Map<string, any>;
  private metrics: NetworkMetrics;

  constructor() {
    this.lastSnapshots = new Map();
    this.metrics = {
      totalBytesSent: 0,
      totalBytesReceived: 0,
      packetsSent: 0,
      packetsReceived: 0,
      bytesSaved: 0
    };
  }

  /**
   * Encode un snapshot complet avec MessagePack
   */
  encodeSnapshot(data: any): Uint8Array {
    const encoded = encode(data);
    this.metrics.totalBytesSent += encoded.length;
    this.metrics.packetsSent++;
    return encoded;
  }

  /**
   * Décode un snapshot MessagePack
   */
  decodeSnapshot(data: Uint8Array): any {
    const decoded = decode(data);
    this.metrics.totalBytesReceived += data.length;
    this.metrics.packetsReceived++;
    return decoded;
  }

  /**
   * Crée un delta compressé entre le snapshot actuel et le précédent
   */
  createDeltaSnapshot(playerId: string, currentSnapshot: any): Uint8Array | null {
    const lastSnapshot = this.lastSnapshots.get(playerId);

    if (!lastSnapshot) {
      const encoded = this.encodeSnapshot({
        type: 'full',
        data: currentSnapshot,
        timestamp: Date.now()
      });
      this.lastSnapshots.set(playerId, currentSnapshot);
      return encoded;
    }

    const delta = this.calculateDelta(lastSnapshot, currentSnapshot);

    if (Object.keys(delta).length === 0) {
      return null;
    }

    const encoded = this.encodeSnapshot({
      type: 'delta',
      data: delta,
      timestamp: Date.now()
    });

    this.lastSnapshots.set(playerId, currentSnapshot);

    const fullSize = encode(currentSnapshot).length;
    this.metrics.bytesSaved += (fullSize - encoded.length);

    return encoded;
  }

  /**
   * Calcule les différences entre deux objets
   */
  private calculateDelta(oldObj: any, newObj: any): any {
    const delta: any = {};

    for (const key in newObj) {
      if (Array.isArray(newObj[key])) {
        if (!oldObj[key] ||
            oldObj[key].length !== newObj[key].length ||
            !this.arraysEqual(oldObj[key], newObj[key])) {
          delta[key] = newObj[key];
        }
      } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
        if (!oldObj[key] || !this.objectsEqual(oldObj[key], newObj[key])) {
          delta[key] = newObj[key];
        }
      } else {
        if (oldObj[key] !== newObj[key]) {
          delta[key] = newObj[key];
        }
      }
    }

    return delta;
  }

  private arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private objectsEqual(a: any, b: any): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (a[key] !== b[key]) return false;
    }

    return true;
  }

  /**
   * Applique un delta à un snapshot
   */
  applyDelta(baseSnapshot: any, delta: any): any {
    return { ...baseSnapshot, ...delta };
  }

  /**
   * Récupère les métriques de performance
   */
  getMetrics() {
    const totalPotential = this.metrics.totalBytesSent + this.metrics.bytesSaved;
    const compressionRatio = totalPotential > 0 ? 
      (this.metrics.bytesSaved / totalPotential * 100) : 0;

    return {
      ...this.metrics,
      compressionRatio: compressionRatio.toFixed(2) + '%',
      averagePacketSize: this.metrics.packetsSent > 0 ?
        (this.metrics.totalBytesSent / this.metrics.packetsSent).toFixed(2) : 0
    };
  }

  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      totalBytesSent: 0,
      totalBytesReceived: 0,
      packetsSent: 0,
      packetsReceived: 0,
      bytesSaved: 0
    };
  }

  /**
   * Supprime les snapshots d'un joueur
   */
  clearPlayer(playerId: string): void {
    this.lastSnapshots.delete(playerId);
  }
}
