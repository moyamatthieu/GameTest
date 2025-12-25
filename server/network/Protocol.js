import { encode, decode } from '@msgpack/msgpack';

/**
 * Protocol de sérialisation binaire optimisé pour le jeu
 * Utilise MessagePack + Delta Compression pour réduire la bande passante
 */
export class NetworkProtocol {
  constructor() {
    this.lastSnapshots = new Map(); // playerId -> snapshot
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
   * @param {Object} data - Données à sérialiser
   * @returns {Uint8Array} Données encodées
   */
  encodeSnapshot(data) {
    const startTime = Date.now();
    const encoded = encode(data);
    const encodeTime = Date.now() - startTime;

    this.metrics.totalBytesSent += encoded.length;
    this.metrics.packetsSent++;

    return encoded;
  }

  /**
   * Décode un snapshot MessagePack
   * @param {Uint8Array} data - Données à désérialiser
   * @returns {Object} Données décodées
   */
  decodeSnapshot(data) {
    const startTime = Date.now();
    const decoded = decode(data);
    const decodeTime = Date.now() - startTime;

    this.metrics.totalBytesReceived += data.length;
    this.metrics.packetsReceived++;

    return decoded;
  }

  /**
   * Crée un delta compressé entre le snapshot actuel et le précédent
   * Ne sérialise que les champs qui ont changé
   * @param {string} playerId - ID du joueur
   * @param {Object} currentSnapshot - Snapshot actuel
   * @returns {Uint8Array} Delta compressé
   */
  createDeltaSnapshot(playerId, currentSnapshot) {
    const lastSnapshot = this.lastSnapshots.get(playerId);

    if (!lastSnapshot) {
      // Premier snapshot, on envoie tout
      const encoded = this.encodeSnapshot({
        type: 'full',
        data: currentSnapshot,
        timestamp: Date.now()
      });
      this.lastSnapshots.set(playerId, currentSnapshot);
      return encoded;
    }

    // Calculer les différences
    const delta = this.calculateDelta(lastSnapshot, currentSnapshot);

    if (Object.keys(delta).length === 0) {
      // Aucun changement
      return null;
    }

    const encoded = this.encodeSnapshot({
      type: 'delta',
      data: delta,
      timestamp: Date.now()
    });

    // Mettre à jour le dernier snapshot
    this.lastSnapshots.set(playerId, currentSnapshot);

    // Calculer les économies de bande passante
    const fullSize = this.encodeSnapshot(currentSnapshot).length;
    this.metrics.bytesSaved += (fullSize - encoded.length);

    return encoded;
  }

  /**
   * Calcule les différences entre deux objets
   * @param {Object} oldObj - Ancien objet
   * @param {Object} newObj - Nouvel objet
   * @returns {Object} Objet contenant uniquement les champs modifiés
   */
  calculateDelta(oldObj, newObj) {
    const delta = {};

    for (const key in newObj) {
      if (Array.isArray(newObj[key])) {
        // Pour les tableaux, on compare la longueur et chaque élément
        if (!oldObj[key] ||
            oldObj[key].length !== newObj[key].length ||
            !this.arraysEqual(oldObj[key], newObj[key])) {
          delta[key] = newObj[key];
        }
      } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
        // Pour les objets imbriqués, on compare récursivement
        if (!oldObj[key] || !this.objectsEqual(oldObj[key], newObj[key])) {
          delta[key] = newObj[key];
        }
      } else {
        // Pour les valeurs primitives
        if (oldObj[key] !== newObj[key]) {
          delta[key] = newObj[key];
        }
      }
    }

    return delta;
  }

  /**
   * Compare deux tableaux
   */
  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Compare deux objets
   */
  objectsEqual(a, b) {
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
   * @param {Object} baseSnapshot - Snapshot de base
   * @param {Object} delta - Delta à appliquer
   * @returns {Object} Snapshot mis à jour
   */
  applyDelta(baseSnapshot, delta) {
    const result = { ...baseSnapshot };

    for (const key in delta) {
      result[key] = delta[key];
    }

    return result;
  }

  /**
   * Récupère les métriques de performance
   */
  getMetrics() {
    const compressionRatio = this.metrics.bytesSaved /
      (this.metrics.totalBytesSent + this.metrics.bytesSaved) * 100;

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
  resetMetrics() {
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
  clearPlayer(playerId) {
    this.lastSnapshots.delete(playerId);
  }
}
