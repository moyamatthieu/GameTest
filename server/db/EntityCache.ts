import { EventEmitter } from 'events';
import { DatabaseManager } from './DatabaseManager';

interface CachedEntity {
  data: any;
  isDirty: boolean;
  lastAccess: number;
}

interface CacheMetrics {
  cacheHits: number;
  cacheMisses: number;
  writesDeferred: number;
  writesExecuted: number;
  cacheSize: number;
  lastWriteTime: number;
}

/**
 * EntityCache - Système de cache en mémoire avec write-back automatique
 */
export class EntityCache extends EventEmitter {
  private db: DatabaseManager;
  private writeBackInterval: number;
  private cache: Map<number, CachedEntity>;
  private writeQueue: Map<number, any>;
  private metrics: CacheMetrics;
  private writeBackTimer: NodeJS.Timeout | null = null;

  constructor(databaseManager: DatabaseManager, writeBackInterval = 5000) {
    super();
    this.db = databaseManager;
    this.writeBackInterval = writeBackInterval;
    this.cache = new Map();
    this.writeQueue = new Map();

    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      writesDeferred: 0,
      writesExecuted: 0,
      cacheSize: 0,
      lastWriteTime: Date.now()
    };

    this.startWriteBack();
  }

  async getEntity(entityId: number, options: any = {}): Promise<any> {
    const { forceRefresh = false, includeComponents = true } = options;

    if (!forceRefresh && this.cache.has(entityId)) {
      const cached = this.cache.get(entityId)!;
      const now = Date.now();
      const maxAge = options.maxAge || 300000;

      if (now - cached.lastAccess < maxAge) {
        cached.lastAccess = now;
        this.metrics.cacheHits++;
        return cached.data;
      }
    }

    this.metrics.cacheMisses++;

    try {
      const entityData = await this.db.getEntity(entityId, { includeComponents });

      if (entityData) {
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

  async updateEntity(entityId: number, entityData: any, options: any = {}): Promise<boolean> {
    const { immediate = false, markDirty = true } = options;

    try {
      this.cache.set(entityId, {
        data: entityData,
        isDirty: markDirty,
        lastAccess: Date.now()
      });

      if (immediate) {
        await this.db.updateEntity(entityId, entityData);
        this.metrics.writesExecuted++;
        if (this.cache.has(entityId)) {
          this.cache.get(entityId)!.isDirty = false;
        }
      } else {
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

  async updateEntities(updates: Record<string, any>, options: any = {}): Promise<boolean[]> {
    const { immediate = false } = options;
    const results: boolean[] = [];

    for (const [entityId, entityData] of Object.entries(updates)) {
      const id = parseInt(entityId);
      results.push(await this.updateEntity(id, entityData, { ...options, immediate }));
    }

    return results;
  }

  getDirtyEntities(): Map<number, any> {
    const dirty = new Map<number, any>();
    for (const [entityId, cached] of this.cache.entries()) {
      if (cached.isDirty) {
        dirty.set(entityId, cached.data);
      }
    }
    return dirty;
  }

  async flush(): Promise<{ success: boolean; count: number }> {
    const dirtyEntities = this.getDirtyEntities();
    const queueEntities = Array.from(this.writeQueue.entries());

    const allUpdates = new Map<number, any>([...dirtyEntities, ...queueEntities]);

    if (allUpdates.size === 0) {
      return { success: true, count: 0 };
    }

    try {
      await this.db.updateEntitiesBatch(allUpdates);

      for (const [entityId] of allUpdates) {
        if (this.cache.has(entityId)) {
          this.cache.get(entityId)!.isDirty = false;
        }
      }

      this.writeQueue.clear();
      const count = allUpdates.size;
      this.metrics.writesExecuted += count;
      this.metrics.lastWriteTime = Date.now();

      this.emit('flushCompleted', { count, timestamp: Date.now() });
      return { success: true, count };
    } catch (error) {
      console.error('Error flushing cache:', error);
      this.emit('flushError', { error, count: allUpdates.size });
      throw error;
    }
  }

  startWriteBack(): void {
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

  stopWriteBack(): void {
    if (this.writeBackTimer) {
      clearInterval(this.writeBackTimer);
      this.writeBackTimer = null;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      dirtyCount: this.getDirtyEntities().size,
      queueSize: this.writeQueue.size,
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses || 1)
    };
  }

  resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      writesDeferred: 0,
      writesExecuted: 0,
      cacheSize: this.cache.size,
      lastWriteTime: Date.now()
    };
  }

  destroy(): void {
    this.stopWriteBack();
    this.cache.clear();
    this.writeQueue.clear();
    this.removeAllListeners();
  }
}
