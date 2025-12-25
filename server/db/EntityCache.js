import { EventEmitter } from 'events';

/**
 * EntityCache - Système de cache en mémoire avec write-back automatique
 *
 * Fonctionnalités :
 * - Cache en mémoire avec marquage "dirty"
 * - Write-back automatique toutes les 5 secondes
 * - Batch updates pour les écritures groupées
 * - Métriques de performance
 */
export class EntityCache extends EventEmitter {
  constructor(databaseManager, writeBackInterval = 5000) {
    super();
    this.db = databaseManager;
    this.writeBackInterval = writeBackInterval;

    // Cache en mémoire : Map<entityId, {data, isDirty, lastAccess}>
    this.cache = new Map();

    // File d'attente des écritures différées
    this.writeQueue = new Map();

    // Métriques de performance
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      writesDeferred: 0,
      writesExecuted: 0,
      cacheSize: 0,
      lastWriteTime: Date.now()
    };

    // Démarrer le write-back automatique
    this.startWriteBack();

    console.log(`EntityCache initialized with ${writeBackInterval}ms write-back interval`);
  }

  /**
   * Obtenir une entité depuis le cache ou la base de données
   */
  async getEntity(entityId, options = {}) {
    const { forceRefresh = false, includeComponents = true } = options;

    // Vérifier si l'entité est en cache et non expirée
    if (!forceRefresh && this.cache.has(entityId)) {
      const cached = this.cache.get(entityId);
      const now = Date.now();

      // Vérifier l'expiration (5 minutes par défaut)
      const maxAge = options.maxAge || 300000;
      if (now - cached.lastAccess < maxAge) {
        cached.lastAccess = now;
        this.metrics.cacheHits++;
        return cached.data;
      }
    }

    // Cache miss : charger depuis la base de données
    this.metrics.cacheMisses++;

    try {
      const entityData = await this.db.getEntity(entityId, { includeComponents });

      if (entityData) {
        // Mettre en cache
        this.cache.set(entityId, {
          data: entityData,
          isDirty: false,
          lastAccess: Date.now()
        });

        this.metrics.cacheSize = this.cache.size;
      }

      return entityData;
    } catch (error) {
      console.error(`Error loading entity ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir plusieurs entités en batch
   */
  async getEntities(entityIds, options = {}) {
    const { forceRefresh = false } = options;

    const result = new Map();
    const toLoad = [];

    // Séparer les entités en cache de celles à charger
    for (const id of entityIds) {
      if (!forceRefresh && this.cache.has(id)) {
        const cached = this.cache.get(id);
        cached.lastAccess = Date.now();
        result.set(id, cached.data);
        this.metrics.cacheHits++;
      } else {
        toLoad.push(id);
        this.metrics.cacheMisses++;
      }
    }

    // Charger les entités manquantes en batch
    if (toLoad.length > 0) {
      try {
        const loadedEntities = await this.db.getEntities(toLoad, options);

        for (const [id, data] of Object.entries(loadedEntities)) {
          if (data) {
            this.cache.set(parseInt(id), {
              data,
              isDirty: false,
              lastAccess: Date.now()
            });
            result.set(parseInt(id), data);
          }
        }

        this.metrics.cacheSize = this.cache.size;
      } catch (error) {
        console.error(`Error loading entities batch:`, error);
        throw error;
      }
    }

    return result;
  }

  /**
   * Mettre à jour une entité (marquée comme dirty)
   */
  async updateEntity(entityId, entityData, options = {}) {
    const { immediate = false, markDirty = true } = options;

    try {
      // Mettre à jour le cache
      this.cache.set(entityId, {
        data: entityData,
        isDirty: markDirty,
        lastAccess: Date.now()
      });

      if (immediate) {
        // Écriture immédiate
        await this.db.updateEntity(entityId, entityData);
        this.metrics.writesExecuted++;

        // Marquer comme non dirty
        if (this.cache.has(entityId)) {
          this.cache.get(entityId).isDirty = false;
        }
      } else {
        // Ajouter à la file d'attente des écritures différées
        this.writeQueue.set(entityId, entityData);
        this.metrics.writesDeferred++;
      }

      this.emit('entityUpdated', { entityId, entityData, immediate });
      return true;
    } catch (error) {
      console.error(`Error updating entity ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour plusieurs entités en batch
   */
  async updateEntities(updates, options = {}) {
    const { immediate = false } = options;

    const results = [];

    for (const [entityId, entityData] of Object.entries(updates)) {
      const id = parseInt(entityId);
      results.push(await this.updateEntity(id, entityData, { ...options, immediate }));
    }

    return results;
  }

  /**
   * Supprimer une entité du cache et de la base de données
   */
  async deleteEntity(entityId, options = {}) {
    const { immediate = false } = options;

    // Supprimer du cache
    this.cache.delete(entityId);

    // Supprimer de la file d'attente
    this.writeQueue.delete(entityId);

    if (immediate) {
      await this.db.deleteEntity(entityId);
    } else {
      // Ajouter à la file de suppression
      this.writeQueue.set(entityId, null);
    }

    this.metrics.cacheSize = this.cache.size;
    this.emit('entityDeleted', { entityId });

    return true;
  }

  /**
   * Obtenir les entités dirty (modifiées mais non sauvegardées)
   */
  getDirtyEntities() {
    const dirty = new Map();

    for (const [entityId, cached] of this.cache.entries()) {
      if (cached.isDirty) {
        dirty.set(entityId, cached.data);
      }
    }

    return dirty;
  }

  /**
   * Forcer la sauvegarde de toutes les entités dirty
   */
  async flush() {
    const dirtyEntities = this.getDirtyEntities();
    const queueEntities = Array.from(this.writeQueue.entries());

    const allUpdates = new Map([...dirtyEntities, ...queueEntities]);

    if (allUpdates.size === 0) {
      return { success: true, count: 0 };
    }

    try {
      // Exécuter les écritures en batch
      await this.db.updateEntitiesBatch(allUpdates);

      // Marquer toutes les entités comme non dirty
      for (const [entityId] of allUpdates) {
        if (this.cache.has(entityId)) {
          this.cache.get(entityId).isDirty = false;
        }
      }

      // Vider la file d'attente
      this.writeQueue.clear();

      const count = allUpdates.size;
      this.metrics.writesExecuted += count;
      this.metrics.lastWriteTime = Date.now();

      this.emit('flushCompleted', { count, timestamp: Date.now() });

      console.log(`EntityCache: Flushed ${count} entities to database`);

      return { success: true, count };
    } catch (error) {
      console.error('Error flushing cache:', error);
      this.emit('flushError', { error, count: allUpdates.size });
      throw error;
    }
  }

  /**
   * Démarrer le write-back automatique
   */
  startWriteBack() {
    if (this.writeBackTimer) {
      clearInterval(this.writeBackTimer);
    }

    this.writeBackTimer = setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        console.error('Write-back error:', error);
      }
    }, this.writeBackInterval);
  }

  /**
   * Arrêter le write-back automatique
   */
  stopWriteBack() {
    if (this.writeBackTimer) {
      clearInterval(this.writeBackTimer);
      this.writeBackTimer = null;
    }
  }

  /**
   * Vider le cache
   */
  clear() {
    this.cache.clear();
    this.writeQueue.clear();
    this.metrics.cacheSize = 0;
    this.emit('cacheCleared');
  }

  /**
   * Obtenir les métriques de performance
   */
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.lastWriteTime;

    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      dirtyCount: this.getDirtyEntities().size,
      queueSize: this.writeQueue.size,
      uptime,
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses || 1)
    };
  }

  /**
   * Réinitialiser les métriques
   */
  resetMetrics() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      writesDeferred: 0,
      writesExecuted: 0,
      cacheSize: this.cache.size,
      lastWriteTime: Date.now()
    };
  }

  /**
   * Nettoyage
   */
  destroy() {
    this.stopWriteBack();
    this.clear();
    this.removeAllListeners();
  }
}
