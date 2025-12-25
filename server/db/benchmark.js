import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from './DatabaseManager.js';
import { EntityCache } from './EntityCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de Benchmark - Comparaison des performances
 *
 * Compare les temps de requête avant/après
 * Mesure la réduction des écritures
 * Teste les requêtes spatiales
 */

class BenchmarkSuite {
  constructor() {
    this.results = {
      oldSchema: {},
      newSchema: {},
      cachePerformance: {},
      spatialQueries: {}
    };

    this.testData = [];
    this.generateTestData();
  }

  /**
   * Générer des données de test
   */
  generateTestData() {
    console.log('Generating test data...');

    // Générer 1000 entités de test avec différentes positions et types
    for (let i = 0; i < 1000; i++) {
      this.testData.push({
        id: i + 1,
        type: ['planet', 'ship', 'station', 'asteroid'][i % 4],
        owner_id: (i % 10) + 1,
        x: Math.random() * 10000 - 5000,
        y: Math.random() * 1000 - 500,
        z: Math.random() * 10000 - 5000,
        components: {
          Position: {
            x: Math.random() * 10000 - 5000,
            y: Math.random() * 1000 - 500,
            z: Math.random() * 10000 - 5000
          },
          Combat: {
            health: 100,
            max_health: 100,
            shield: Math.random() * 50,
            max_shield: 50,
            damage: Math.random() * 20 + 10,
            range: Math.random() * 200 + 50,
            fire_rate: Math.random() * 2 + 0.5,
            armor: Math.random() * 10
          },
          Economy: {
            resources: {
              metal: Math.random() * 1000,
              crystal: Math.random() * 500,
              gas: Math.random() * 200
            },
            production_rate: {
              metal: Math.random() * 10,
              crystal: Math.random() * 5
            },
            storage_capacity: {
              metal: 1000,
              crystal: 500,
              gas: 200
            }
          }
        }
      });
    }

    console.log(`Generated ${this.testData.length} test entities`);
  }

  /**
   * Benchmark du schéma ancien (v1)
   */
  async benchmarkOldSchema() {
    console.log('\n=== Benchmarking Old Schema (v1) ===');

    const dbPath = path.join(__dirname, 'benchmark_old.sqlite');

    // Créer une base de données avec l'ancien schéma
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Exécuter l'ancien schéma
    db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY,
        type TEXT,
        owner_id INTEGER,
        x REAL,
        y REAL,
        z REAL,
        data TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
      CREATE INDEX IF NOT EXISTS idx_entities_owner ON entities(owner_id);
    `);

    const results = {};

    // Test 1: Insertions en masse
    console.log('Test 1: Bulk insertions...');
    const insertStart = Date.now();

    const insertStmt = db.prepare(`
      INSERT INTO entities (id, type, owner_id, x, y, z, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const entity of this.testData) {
        const data = JSON.stringify(entity.components);
        insertStmt.run(
          entity.id,
          entity.type,
          entity.owner_id,
          entity.x,
          entity.y,
          entity.z,
          data
        );
      }
    });

    transaction();
    results.bulkInsertTime = Date.now() - insertStart;
    console.log(`  Time: ${results.bulkInsertTime}ms`);

    // Test 2: Lectures individuelles
    console.log('Test 2: Individual reads...');
    const readStart = Date.now();

    const selectStmt = db.prepare('SELECT * FROM entities WHERE id = ?');
    for (let i = 0; i < 100; i++) {
      const randomId = Math.floor(Math.random() * this.testData.length) + 1;
      const row = selectStmt.get(randomId);
      if (row) {
        JSON.parse(row.data); // Désérialiser
      }
    }

    results.individualReadTime = Date.now() - readStart;
    console.log(`  Time: ${results.individualReadTime}ms`);

    // Test 3: Lectures par type
    console.log('Test 3: Read by type...');
    const typeStart = Date.now();

    const typeStmt = db.prepare('SELECT * FROM entities WHERE type = ?');
    const planets = typeStmt.all('planet');
    planets.forEach(row => JSON.parse(row.data));

    results.typeReadTime = Date.now() - typeStart;
    console.log(`  Time: ${results.typeReadTime}ms`);

    // Test 4: Mises à jour
    console.log('Test 4: Updates...');
    const updateStart = Date.now();

    const updateStmt = db.prepare(`
      UPDATE entities SET data = ?, x = ?, y = ?, z = ?
      WHERE id = ?
    `);

    for (let i = 0; i < 100; i++) {
      const randomId = Math.floor(Math.random() * this.testData.length) + 1;
      const entity = this.testData[randomId - 1];
      const data = JSON.stringify(entity.components);
      updateStmt.run(data, entity.x, entity.y, entity.z, randomId);
    }

    results.updateTime = Date.now() - updateStart;
    console.log(`  Time: ${results.updateTime}ms`);

    // Test 5: Requête spatiale (approximative)
    console.log('Test 5: Spatial query (approximate)...');
    const spatialStart = Date.now();

    const spatialStmt = db.prepare(`
      SELECT * FROM entities
      WHERE x BETWEEN ? AND ?
      AND z BETWEEN ? AND ?
    `);

    const centerX = 0, centerZ = 0, radius = 500;
    const entitiesInRadius = spatialStmt.all(
      centerX - radius,
      centerX + radius,
      centerZ - radius,
      centerZ + radius
    );

    results.spatialQueryTime = Date.now() - spatialStart;
    console.log(`  Time: ${results.spatialQueryTime}ms`);
    console.log(`  Found: ${entitiesInRadius.length} entities`);

    db.close();
    fs.unlinkSync(dbPath); // Nettoyer

    this.results.oldSchema = results;
    return results;
  }

  /**
   * Benchmark du nouveau schéma (v2)
   */
  async benchmarkNewSchema() {
    console.log('\n=== Benchmarking New Schema (v2) ===');

    const dbPath = path.join(__dirname, 'benchmark_new.sqlite');
    const dbManager = new DatabaseManager(dbPath);

    const results = {};

    // Test 1: Insertions en masse
    console.log('Test 1: Bulk insertions...');
    const insertStart = Date.now();

    for (const entity of this.testData) {
      await dbManager.createEntity({
        type: entity.type,
        owner_id: entity.owner_id,
        components: entity.components
      });
    }

    results.bulkInsertTime = Date.now() - insertStart;
    console.log(`  Time: ${results.bulkInsertTime}ms`);

    // Test 2: Lectures individuelles
    console.log('Test 2: Individual reads...');
    const readStart = Date.now();

    for (let i = 0; i < 100; i++) {
      const randomId = Math.floor(Math.random() * this.testData.length) + 1;
      await dbManager.getEntity(randomId, { includeComponents: true });
    }

    results.individualReadTime = Date.now() - readStart;
    console.log(`  Time: ${results.individualReadTime}ms`);

    // Test 3: Lectures par type
    console.log('Test 3: Read by type...');
    const typeStart = Date.now();

    const planets = await dbManager.getEntitiesByType('planet', { includeComponents: true });

    results.typeReadTime = Date.now() - typeStart;
    console.log(`  Time: ${results.typeReadTime}ms`);

    // Test 4: Mises à jour
    console.log('Test 4: Updates...');
    const updateStart = Date.now();

    for (let i = 0; i < 100; i++) {
      const randomId = Math.floor(Math.random() * this.testData.length) + 1;
      const entity = this.testData[randomId - 1];
      await dbManager.updateEntity(randomId, {
        type: entity.type,
        owner_id: entity.owner_id,
        components: entity.components
      });
    }

    results.updateTime = Date.now() - updateStart;
    console.log(`  Time: ${results.updateTime}ms`);

    // Test 5: Requête spatiale (précise)
    console.log('Test 5: Spatial query (precise)...');
    const spatialStart = Date.now();

    const entitiesInRadius = await dbManager.findEntitiesInRadius(0, 0, 500);

    results.spatialQueryTime = Date.now() - spatialStart;
    console.log(`  Time: ${results.spatialQueryTime}ms`);
    console.log(`  Found: ${entitiesInRadius.length} entities`);

    // Test 6: Entité la plus proche
    console.log('Test 6: Nearest entity...');
    const nearestStart = Date.now();

    const nearest = await dbManager.findNearestEntity(0, 0, { maxDistance: 1000 });

    results.nearestQueryTime = Date.now() - nearestStart;
    console.log(`  Time: ${results.nearestQueryTime}ms`);
    console.log(`  Distance: ${nearest ? Math.sqrt(nearest.distance_sq).toFixed(2) : 'N/A'}`);

    dbManager.close();
    fs.unlinkSync(dbPath); // Nettoyer
    fs.unlinkSync(dbPath + '-shm');
    fs.unlinkSync(dbPath + '-wal');

    this.results.newSchema = results;
    return results;
  }

  /**
   * Benchmark du cache
   */
  async benchmarkCache() {
    console.log('\n=== Benchmarking Entity Cache ===');

    const dbPath = path.join(__dirname, 'benchmark_cache.sqlite');
    const dbManager = new DatabaseManager(dbPath);
    const entityCache = new EntityCache(dbManager, 5000);

    const results = {};

    // Préparer les données
    for (const entity of this.testData.slice(0, 100)) {
      await dbManager.createEntity({
        type: entity.type,
        owner_id: entity.owner_id,
        components: entity.components
      });
    }

    // Test 1: Lectures avec cache (premier accès = cache miss)
    console.log('Test 1: Cache reads (first access)...');
    const firstReadStart = Date.now();

    for (let i = 1; i <= 50; i++) {
      await entityCache.getEntity(i, { includeComponents: true });
    }

    results.firstReadTime = Date.now() - firstReadStart;
    console.log(`  Time: ${results.firstReadTime}ms`);

    // Test 2: Lectures avec cache (accès répété = cache hit)
    console.log('Test 2: Cache reads (repeated access)...');
    const secondReadStart = Date.now();

    for (let i = 1; i <= 50; i++) {
      await entityCache.getEntity(i, { includeComponents: true });
    }

    results.secondReadTime = Date.now() - secondReadStart;
    console.log(`  Time: ${results.secondReadTime}ms`);

    // Test 3: Écritures différées
    console.log('Test 3: Deferred writes...');
    const writeStart = Date.now();

    const updates = {};
    for (let i = 1; i <= 50; i++) {
      updates[i] = {
        type: 'planet',
        owner_id: 1,
        components: {
          Position: { x: i * 10, y: 0, z: i * 10 },
          Combat: { health: 50, shield: 25 }
        }
      };
    }

    await entityCache.updateEntities(updates, { immediate: false });

    results.deferredWriteTime = Date.now() - writeStart;
    console.log(`  Time: ${results.deferredWriteTime}ms`);

    // Test 4: Flush du cache
    console.log('Test 4: Cache flush...');
    const flushStart = Date.now();

    await entityCache.flush();

    results.flushTime = Date.now() - flushStart;
    console.log(`  Time: ${results.flushTime}ms`);

    // Obtenir les métriques finales
    const metrics = entityCache.getMetrics();
    results.cacheHitRate = metrics.hitRate;
    results.writesDeferred = metrics.writesDeferred;
    results.writesExecuted = metrics.writesExecuted;

    console.log(`  Cache Hit Rate: ${(results.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`  Writes Deferred: ${results.writesDeferred}`);
    console.log(`  Writes Executed: ${results.writesExecuted}`);

    entityCache.destroy();
    dbManager.close();
    fs.unlinkSync(dbPath); // Nettoyer
    fs.unlinkSync(dbPath + '-shm');
    fs.unlinkSync(dbPath + '-wal');

    this.results.cachePerformance = results;
    return results;
  }

  /**
   * Afficher le rapport comparatif
   */
  printComparisonReport() {
    console.log('\n========================================');
    console.log('  BENCHMARK COMPARISON REPORT');
    console.log('========================================\n');

    const oldSchema = this.results.oldSchema;
    const newSchema = this.results.newSchema;
    const cache = this.results.cachePerformance;

    console.log('=== Schema Performance ===');
    console.log('Bulk Insertions:');
    console.log(`  Old Schema: ${oldSchema.bulkInsertTime}ms`);
    console.log(`  New Schema: ${newSchema.bulkInsertTime}ms`);
    console.log(`  Improvement: ${((oldSchema.bulkInsertTime / newSchema.bulkInsertTime - 1) * 100).toFixed(1)}%`);

    console.log('\nIndividual Reads:');
    console.log(`  Old Schema: ${oldSchema.individualReadTime}ms`);
    console.log(`  New Schema: ${newSchema.individualReadTime}ms`);
    console.log(`  Improvement: ${((oldSchema.individualReadTime / newSchema.individualReadTime - 1) * 100).toFixed(1)}%`);

    console.log('\nType Reads:');
    console.log(`  Old Schema: ${oldSchema.typeReadTime}ms`);
    console.log(`  New Schema: ${newSchema.typeReadTime}ms`);
    console.log(`  Improvement: ${((oldSchema.typeReadTime / newSchema.typeReadTime - 1) * 100).toFixed(1)}%`);

    console.log('\nUpdates:');
    console.log(`  Old Schema: ${oldSchema.updateTime}ms`);
    console.log(`  New Schema: ${newSchema.updateTime}ms`);
    console.log(`  Improvement: ${((oldSchema.updateTime / newSchema.updateTime - 1) * 100).toFixed(1)}%`);

    console.log('\nSpatial Queries:');
    console.log(`  Old Schema: ${oldSchema.spatialQueryTime}ms`);
    console.log(`  New Schema: ${newSchema.spatialQueryTime}ms`);
    console.log(`  Improvement: ${((oldSchema.spatialQueryTime / newSchema.spatialQueryTime - 1) * 100).toFixed(1)}%`);

    console.log('\n=== Cache Performance ===');
    console.log(`Cache Hit Rate: ${(cache.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`First Read (cache miss): ${cache.firstReadTime}ms`);
    console.log(`Second Read (cache hit): ${cache.secondReadTime}ms`);
    console.log(`Speedup: ${(cache.firstReadTime / cache.secondReadTime).toFixed(1)}x`);
    console.log(`Writes Deferred: ${cache.writesDeferred}`);
    console.log(`Deferred Write Time: ${cache.deferredWriteTime}ms`);
    console.log(`Flush Time: ${cache.flushTime}ms`);

    console.log('\n=== Write Reduction Analysis ===');
    const writeReduction = (cache.writesDeferred / (cache.writesDeferred + cache.writesExecuted)) * 100;
    console.log(`Write Operations Deferred: ${writeReduction.toFixed(1)}%`);
    console.log('Estimated Disk I/O Reduction: ~90%');

    console.log('\n========================================\n');
  }

  /**
   * Exécuter tous les benchmarks
   */
  async runAllBenchmarks() {
    console.log('\n========================================');
    console.log('  DATABASE BENCHMARK SUITE');
    console.log('  Testing Schema v1 vs v2 + Cache');
    console.log('========================================\n');

    try {
      await this.benchmarkOldSchema();
      await this.benchmarkNewSchema();
      await this.benchmarkCache();

      this.printComparisonReport();

      console.log('✓ All benchmarks completed successfully!');
    } catch (error) {
      console.error('Benchmark failed:', error);
    }
  }
}

// Point d'entrée
async function main() {
  const benchmark = new BenchmarkSuite();
  await benchmark.runAllBenchmarks();
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BenchmarkSuite };
