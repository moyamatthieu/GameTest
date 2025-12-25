import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de Migration des Données
 *
 * Migre les données de l'ancien schéma (schema.sql) vers le nouveau (schema_v2.sql)
 * - Lit l'ancien schéma JSON sérialisé
 * - Convertit en nouvelles tables normalisées
 * - Préserve toutes les relations
 * - Valide les données migrées
 */

class DataMigrator {
  constructor(oldDbPath, newDbPath) {
    this.oldDbPath = oldDbPath || path.join(__dirname, '../game.sqlite');
    this.newDbPath = newDbPath || path.join(__dirname, '../game_v2.sqlite');

    this.oldDb = null;
    this.newDb = null;

    this.migrationStats = {
      totalEntities: 0,
      migratedEntities: 0,
      errors: 0,
      warnings: 0,
      startTime: 0,
      endTime: 0
    };
  }

  /**
   * Initialiser les connexions aux bases de données
   */
  initialize() {
    try {
      // Ouvrir l'ancienne base de données (lecture seule)
      this.oldDb = new Database(this.oldDbPath, { readonly: true });
      console.log(`Connected to old database: ${this.oldDbPath}`);

      // Créer la nouvelle base de données
      this.newDb = new Database(this.newDbPath);
      this.newDb.pragma('journal_mode = WAL');
      this.newDb.pragma('foreign_keys = ON');

      // Exécuter le nouveau schéma
      const schemaPath = path.join(__dirname, 'schema_v2.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.newDb.exec(schema);

      console.log(`Created new database with schema v2: ${this.newDbPath}`);

      return true;
    } catch (error) {
      console.error('Error initializing migration:', error);
      return false;
    }
  }

  /**
   * Analyser la structure de l'ancienne base de données
   */
  analyzeOldSchema() {
    try {
      console.log('\n=== Analyzing Old Schema ===');

      // Vérifier les tables existantes
      const tables = this.oldDb.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        ORDER BY name
      `).all();

      console.log('Existing tables:', tables.map(t => t.name));

      // Compter les entités
      const entityCount = this.oldDb.prepare('SELECT COUNT(*) as count FROM entities').get();
      const playerCount = this.oldDb.prepare('SELECT COUNT(*) as count FROM players').get();

      console.log(`Entities: ${entityCount.count}`);
      console.log(`Players: ${playerCount.count}`);

      // Analyser la structure des données
      const sampleEntity = this.oldDb.prepare('SELECT * FROM entities LIMIT 1').get();
      if (sampleEntity) {
        console.log('\nSample entity structure:');
        console.log('  ID:', sampleEntity.id);
        console.log('  Type:', sampleEntity.type);
        console.log('  Owner:', sampleEntity.owner_id);
        console.log('  Position:', `${sampleEntity.x}, ${sampleEntity.y}, ${sampleEntity.z}`);

        if (sampleEntity.data) {
          try {
            const data = JSON.parse(sampleEntity.data);
            console.log('  Components:', Object.keys(data));
          } catch (e) {
            console.log('  Data (raw):', sampleEntity.data);
          }
        }
      }

      this.migrationStats.totalEntities = entityCount.count;
      return true;
    } catch (error) {
      console.error('Error analyzing old schema:', error);
      return false;
    }
  }

  /**
   * Extraire les composants d'une entité de l'ancien format
   */
  extractComponents(entity) {
    const components = {};

    // Position (toujours présente dans les colonnes x, y, z)
    if (entity.x !== null && entity.y !== null && entity.z !== null) {
      components.Position = {
        x: entity.x,
        y: entity.y,
        z: entity.z
      };
    }

    // Extraire les autres composants du champ data
    if (entity.data) {
      try {
        const data = JSON.parse(entity.data);

        // Composant Economy
        if (data.resources || data.production_rate || data.storage_capacity) {
          components.Economy = {
            resources: data.resources || {},
            production_rate: data.production_rate || {},
            storage_capacity: data.storage_capacity || {}
          };
        }

        // Composant Combat
        if (data.health || data.shield || data.damage) {
          components.Combat = {
            health: data.health || 100,
            max_health: data.max_health || 100,
            shield: data.shield || 0,
            max_shield: data.max_shield || 0,
            damage: data.damage || 10,
            range: data.range || 100,
            fire_rate: data.fire_rate || 1.0,
            armor: data.armor || 0
          };
        }

        // Composant Fleet
        if (data.ship_count !== undefined || data.ship_capacity) {
          components.Fleet = {
            ship_count: data.ship_count || 0,
            ship_capacity: data.ship_capacity || 10,
            ship_types: data.ship_types || {},
            speed: data.speed || 1.0,
            formation: data.formation || 'default',
            target_entity_id: data.target_entity_id || null
          };
        }

        // Composant Construction
        if (data.is_under_construction !== undefined || data.construction_progress !== undefined) {
          components.Construction = {
            is_under_construction: data.is_under_construction || false,
            construction_progress: data.construction_progress || 0,
            construction_time_remaining: data.construction_time_remaining || 0,
            required_resources: data.required_resources || {},
            construction_queue: data.construction_queue || []
          };
        }

        // Composant Sovereignty
        if (data.owner_id || data.influence_radius !== undefined) {
          components.Sovereignty = {
            owner_id: data.owner_id || entity.owner_id,
            influence_radius: data.influence_radius || 100,
            control_level: data.control_level || 1,
            contested: data.contested || false
          };
        }

        // Composant Logistics
        if (data.is_logistics_hub !== undefined || data.connected_entities) {
          components.Logistics = {
            is_logistics_hub: data.is_logistics_hub || false,
            connected_entities: data.connected_entities || [],
            supply_capacity: data.supply_capacity || 1000,
            current_supply: data.current_supply || 0,
            transfer_rate: data.transfer_rate || 10
          };
        }

        // Composant Road
        if (data.start_entity_id || data.end_entity_id) {
          components.Road = {
            start_entity_id: data.start_entity_id,
            end_entity_id: data.end_entity_id,
            distance: data.distance || 0,
            travel_time: data.travel_time || 0,
            is_active: data.is_active !== undefined ? data.is_active : true
          };
        }

      } catch (error) {
        console.warn(`Failed to parse entity data for entity ${entity.id}:`, error.message);
        this.migrationStats.warnings++;
      }
    }

    return components;
  }

  /**
   * Migrer une seule entité
   */
  migrateEntity(entity) {
    try {
      const components = this.extractComponents(entity);

      // Démarrer une transaction pour cette entité
      const transaction = this.newDb.transaction(() => {
        // Insérer l'entité de base
        const insertEntity = this.newDb.prepare(`
          INSERT INTO entities (id, type, owner_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `);

        insertEntity.run(
          entity.id,
          entity.type || 'unknown',
          entity.owner_id || null,
          entity.created_at || new Date().toISOString(),
          entity.updated_at || new Date().toISOString()
        );

        // Insérer les composants
        if (components.Position) {
          const pos = components.Position;
          const insertPosition = this.newDb.prepare(`
            INSERT INTO component_position (entity_id, x, y, z)
            VALUES (?, ?, ?, ?)
          `);
          insertPosition.run(entity.id, pos.x, pos.y, pos.z);
        }

        if (components.Economy) {
          const eco = components.Economy;
          const insertEconomy = this.newDb.prepare(`
            INSERT INTO component_economy
            (entity_id, resources, production_rate, storage_capacity)
            VALUES (?, ?, ?, ?)
          `);
          insertEconomy.run(
            entity.id,
            JSON.stringify(eco.resources),
            JSON.stringify(eco.production_rate),
            JSON.stringify(eco.storage_capacity)
          );
        }

        if (components.Combat) {
          const com = components.Combat;
          const insertCombat = this.newDb.prepare(`
            INSERT INTO component_combat
            (entity_id, health, max_health, shield, max_shield, damage, range, fire_rate, armor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          insertCombat.run(
            entity.id,
            com.health,
            com.max_health,
            com.shield,
            com.max_shield,
            com.damage,
            com.range,
            com.fire_rate,
            com.armor
          );
        }

        if (components.Fleet) {
          const fleet = components.Fleet;
          const insertFleet = this.newDb.prepare(`
            INSERT INTO component_fleet
            (entity_id, ship_count, ship_capacity, ship_types, speed, formation, target_entity_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          insertFleet.run(
            entity.id,
            fleet.ship_count,
            fleet.ship_capacity,
            JSON.stringify(fleet.ship_types),
            fleet.speed,
            fleet.formation,
            fleet.target_entity_id
          );
        }

        if (components.Sovereignty) {
          const sov = components.Sovereignty;
          const insertSovereignty = this.newDb.prepare(`
            INSERT INTO component_sovereignty
            (entity_id, owner_id, influence_radius, control_level, contested)
            VALUES (?, ?, ?, ?, ?)
          `);
          insertSovereignty.run(
            entity.id,
            sov.owner_id,
            sov.influence_radius,
            sov.control_level,
            sov.contested
          );
        }

        if (components.Construction) {
          const cons = components.Construction;
          const insertConstruction = this.newDb.prepare(`
            INSERT INTO component_construction
            (entity_id, is_under_construction, construction_progress,
             construction_time_remaining, required_resources, construction_queue)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          insertConstruction.run(
            entity.id,
            cons.is_under_construction,
            cons.construction_progress,
            cons.construction_time_remaining,
            JSON.stringify(cons.required_resources),
            JSON.stringify(cons.construction_queue)
          );
        }

        if (components.Logistics) {
          const log = components.Logistics;
          const insertLogistics = this.newDb.prepare(`
            INSERT INTO component_logistics
            (entity_id, is_logistics_hub, connected_entities, supply_capacity,
             current_supply, transfer_rate)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          insertLogistics.run(
            entity.id,
            log.is_logistics_hub,
            JSON.stringify(log.connected_entities),
            log.supply_capacity,
            log.current_supply,
            log.transfer_rate
          );
        }

        if (components.Road) {
          const road = components.Road;
          const insertRoad = this.newDb.prepare(`
            INSERT INTO component_road
            (entity_id, start_entity_id, end_entity_id, distance, travel_time, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          insertRoad.run(
            entity.id,
            road.start_entity_id,
            road.end_entity_id,
            road.distance,
            road.travel_time,
            road.is_active
          );
        }
      });

      transaction();
      this.migrationStats.migratedEntities++;

      return true;
    } catch (error) {
      console.error(`Error migrating entity ${entity.id}:`, error.message);
      this.migrationStats.errors++;
      return false;
    }
  }

  /**
   * Migrer tous les joueurs
   */
  migratePlayers() {
    try {
      console.log('\n=== Migrating Players ===');

      const players = this.oldDb.prepare('SELECT * FROM players').all();

      for (const player of players) {
        const insertPlayer = this.newDb.prepare(`
          INSERT INTO players (id, username, last_login, created_at)
          VALUES (?, ?, ?, ?)
        `);

        insertPlayer.run(
          player.id,
          player.username,
          player.last_login,
          player.created_at || new Date().toISOString()
        );
      }

      console.log(`Migrated ${players.length} players`);
      return true;
    } catch (error) {
      console.error('Error migrating players:', error);
      return false;
    }
  }

  /**
   * Exécuter la migration complète
   */
  async runMigration() {
    this.migrationStats.startTime = Date.now();

    console.log('\n========================================');
    console.log('  DATA MIGRATION: Schema v1 -> v2');
    console.log('========================================\n');

    // Initialiser
    if (!this.initialize()) {
      console.error('Failed to initialize migration');
      return false;
    }

    // Analyser l'ancien schéma
    if (!this.analyzeOldSchema()) {
      console.error('Failed to analyze old schema');
      return false;
    }

    // Migrer les joueurs d'abord (pour les clés étrangères)
    if (!this.migratePlayers()) {
      console.error('Failed to migrate players');
      return false;
    }

    // Migrer les entités
    console.log('\n=== Migrating Entities ===');

    const entities = this.oldDb.prepare('SELECT * FROM entities ORDER BY id').all();

    for (const entity of entities) {
      const success = this.migrateEntity(entity);

      // Afficher la progression
      if (this.migrationStats.migratedEntities % 100 === 0) {
        const progress = (this.migrationStats.migratedEntities / this.migrationStats.totalEntities * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${this.migrationStats.migratedEntities}/${this.migrationStats.totalEntities})`);
      }
    }

    this.migrationStats.endTime = Date.now();

    // Afficher le rapport
    this.printMigrationReport();

    // Valider la migration
    this.validateMigration();

    // Fermer les connexions
    this.oldDb.close();
    this.newDb.close();

    return this.migrationStats.errors === 0;
  }

  /**
   * Afficher le rapport de migration
   */
  printMigrationReport() {
    const duration = (this.migrationStats.endTime - this.migrationStats.startTime) / 1000;

    console.log('\n========================================');
    console.log('  MIGRATION REPORT');
    console.log('========================================');
    console.log(`Total Entities: ${this.migrationStats.totalEntities}`);
    console.log(`Migrated: ${this.migrationStats.migratedEntities}`);
    console.log(`Errors: ${this.migrationStats.errors}`);
    console.log(`Warnings: ${this.migrationStats.warnings}`);
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Success Rate: ${(this.migrationStats.migratedEntities / this.migrationStats.totalEntities * 100).toFixed(1)}%`);
    console.log('========================================\n');
  }

  /**
   * Valider la migration
   */
  validateMigration() {
    console.log('\n=== Validating Migration ===');

    try {
      // Vérifier le nombre d'entités
      const oldCount = this.oldDb.prepare('SELECT COUNT(*) as count FROM entities').get();
      const newCount = this.newDb.prepare('SELECT COUNT(*) as count FROM entities').get();

      console.log(`Old DB entities: ${oldCount.count}`);
      console.log(`New DB entities: ${newCount.count}`);

      if (oldCount.count !== newCount.count) {
        console.warn('⚠️  Entity count mismatch!');
        this.migrationStats.warnings++;
      } else {
        console.log('✓ Entity count matches');
      }

      // Vérifier les joueurs
      const oldPlayers = this.oldDb.prepare('SELECT COUNT(*) as count FROM players').get();
      const newPlayers = this.newDb.prepare('SELECT COUNT(*) as count FROM players').get();

      console.log(`Old DB players: ${oldPlayers.count}`);
      console.log(`New DB players: ${newPlayers.count}`);

      if (oldPlayers.count !== newPlayers.count) {
        console.warn('⚠️  Player count mismatch!');
        this.migrationStats.warnings++;
      } else {
        console.log('✓ Player count matches');
      }

      // Vérifier quelques entités aléatoires
      console.log('\n=== Sample Validation ===');
      const sampleIds = this.oldDb.prepare('SELECT id FROM entities ORDER BY RANDOM() LIMIT 3').all();

      for (const { id } of sampleIds) {
        const oldEntity = this.oldDb.prepare('SELECT * FROM entities WHERE id = ?').get(id);
        const newEntity = this.newDb.prepare('SELECT * FROM entities WHERE id = ?').get(id);

        if (oldEntity && newEntity) {
          console.log(`✓ Entity ${id} migrated successfully`);
        } else {
          console.warn(`⚠️  Entity ${id} migration issue`);
          this.migrationStats.warnings++;
        }
      }

    } catch (error) {
      console.error('Error validating migration:', error);
    }
  }
}

// Point d'entrée
async function main() {
  const migrator = new DataMigrator();

  try {
    const success = await migrator.runMigration();

    if (success) {
      console.log('\n✓ Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Backup the old database: cp game.sqlite game.sqlite.backup');
      console.log('2. Replace with new database: cp game_v2.sqlite game.sqlite');
      console.log('3. Restart the server');
    } else {
      console.log('\n✗ Migration completed with errors');
      console.log('Please review the errors above before proceeding');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DataMigrator };
