/**
 * Snapshot Interpolator
 * Lisse les mouvements en interpolant entre les snapshots reçus du serveur
 * Réduit le besoin d'envoyer des paquets fréquents tout en maintenant une apparence fluide
 */
export class SnapshotInterpolator {
  constructor(interpolationDelay = 100) {
    this.interpolationDelay = interpolationDelay; // Délai d'interpolation en ms
    this.snapshots = new Map(); // entityId -> [snapshots]
    this.currentStates = new Map(); // entityId -> current interpolated state
    this.lastUpdateTime = Date.now();

    this.metrics = {
      snapshotsReceived: 0,
      snapshotsDropped: 0,
      interpolationCount: 0,
      averageLatency: 0
    };
  }

  /**
   * Ajoute un nouveau snapshot pour interpolation
   * @param {string} entityId - ID de l'entité
   * @param {Object} snapshot - Données du snapshot
   * @param {number} timestamp - Timestamp du snapshot
   */
  addSnapshot(entityId, snapshot, timestamp) {
    this.metrics.snapshotsReceived++;

    if (!this.snapshots.has(entityId)) {
      this.snapshots.set(entityId, []);
    }

    const entitySnapshots = this.snapshots.get(entityId);

    // Ajouter le nouveau snapshot avec son timestamp
    entitySnapshots.push({
      data: snapshot,
      timestamp: timestamp,
      receivedAt: Date.now()
    });

    // Garder seulement les snapshots récents (max 5)
    while (entitySnapshots.length > 5) {
      entitySnapshots.shift();
      this.metrics.snapshotsDropped++;
    }

    // Trier par timestamp
    entitySnapshots.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Met à jour l'interpolation pour toutes les entités
   * @param {number} currentTime - Temps actuel
   * @returns {Object[]} États interpolés
   */
  update(currentTime = Date.now()) {
    const interpolatedStates = [];
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = currentTime;

    // Temps de référence pour l'interpolation (avec délai)
    const interpolationTime = currentTime - this.interpolationDelay;

    for (const [entityId, snapshots] of this.snapshots) {
      if (snapshots.length < 2) {
        // Pas assez de snapshots pour interpoler, utiliser le plus récent
        if (snapshots.length === 1) {
          this.currentStates.set(entityId, snapshots[0].data);
          interpolatedStates.push({
            id: entityId,
            ...snapshots[0].data
          });
        }
        continue;
      }

      // Trouver les deux snapshots entre lesquels interpoler
      let olderSnapshot = null;
      let newerSnapshot = null;

      for (let i = 0; i < snapshots.length - 1; i++) {
        if (snapshots[i].timestamp <= interpolationTime &&
            snapshots[i + 1].timestamp >= interpolationTime) {
          olderSnapshot = snapshots[i];
          newerSnapshot = snapshots[i + 1];
          break;
        }
      }

      // Si on ne trouve pas de snapshots appropriés, utiliser le plus récent
      if (!olderSnapshot || !newerSnapshot) {
        const latestSnapshot = snapshots[snapshots.length - 1];
        this.currentStates.set(entityId, latestSnapshot.data);
        interpolatedStates.push({
          id: entityId,
          ...latestSnapshot.data
        });
        continue;
      }

      // Calculer le facteur d'interpolation (0 = older, 1 = newer)
      const timeRange = newerSnapshot.timestamp - olderSnapshot.timestamp;
      const timeOffset = interpolationTime - olderSnapshot.timestamp;
      const t = timeRange > 0 ? timeOffset / timeRange : 0;

      // Interpoler les données
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

      // Calculer la latence moyenne
      const latency = currentTime - newerSnapshot.receivedAt;
      this.metrics.averageLatency =
        (this.metrics.averageLatency * 0.9) + (latency * 0.1);
    }

    return interpolatedStates;
  }

  /**
   * Interpole les données entre deux états
   * @param {Object} oldState - Ancien état
   * @param {Object} newState - Nouvel état
   * @param {number} t - Facteur d'interpolation [0-1]
   * @returns {Object} État interpolé
   */
  interpolateData(oldState, newState, t) {
    const result = {};

    for (const key in newState) {
      if (typeof newState[key] === 'object' && newState[key] !== null) {
        if (Array.isArray(newState[key])) {
          // Pour les tableaux, interpoler chaque élément si possible
          result[key] = this.interpolateArray(oldState[key] || [], newState[key], t);
        } else {
          // Pour les objets, interpoler récursivement
          result[key] = this.interpolateData(oldState[key] || {}, newState[key], t);
        }
      } else if (typeof newState[key] === 'number') {
        // Interpolation linéaire pour les nombres
        const oldValue = oldState[key] || 0;
        result[key] = oldValue + (newState[key] - oldValue) * t;
      } else {
        // Pour les autres types, utiliser la nouvelle valeur
        result[key] = newState[key];
      }
    }

    return result;
  }

  /**
   * Interpole un tableau de valeurs
   */
  interpolateArray(oldArray, newArray, t) {
    const result = [];
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

  /**
   * Récupère l'état actuel d'une entité
   * @param {string} entityId - ID de l'entité
   * @returns {Object|null} État actuel ou null si non trouvé
   */
  getEntityState(entityId) {
    return this.currentStates.get(entityId) || null;
  }

  /**
   * Récupère tous les états interpolés
   */
  getAllStates() {
    const states = [];
    for (const [entityId, state] of this.currentStates) {
      states.push({
        id: entityId,
        ...state
      });
    }
    return states;
  }

  /**
   * Supprime une entité de l'interpolateur
   * @param {string} entityId - ID de l'entité
   */
  removeEntity(entityId) {
    this.snapshots.delete(entityId);
    this.currentStates.delete(entityId);
  }

  /**
   * Vide tous les snapshots
   */
  clear() {
    this.snapshots.clear();
    this.currentStates.clear();
    this.lastUpdateTime = Date.now();
    this.metrics = {
      snapshotsReceived: 0,
      snapshotsDropped: 0,
      interpolationCount: 0,
      averageLatency: 0
    };
  }

  /**
   * Récupère les métriques de performance
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageLatency: this.metrics.averageLatency.toFixed(2) + 'ms',
      activeEntities: this.snapshots.size
    };
  }

  /**
   * Définit le délai d'interpolation
   * @param {number} delay - Délai en millisecondes
   */
  setInterpolationDelay(delay) {
    this.interpolationDelay = delay;
  }
}
