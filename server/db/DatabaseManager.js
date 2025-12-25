import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DatabaseManager - Interface unique pour toutes les opérations CRUD
 *
 * Fonctionnalités :
 * - Requêtes préparées pour la performance
 * - Gestion des transactions
 * - Support des requêtes spatiales (proximité, rayon)
 * - Opérations batch
 */
export class DatabaseManager {
  constructor(dbPath = null, schemaPath = null) {
    this.dbPath = dbPath || path.join(__dirname, '../game_debug_123.sqlite');
    this.schemaPath = schemaPath || path.join(__dirname, 'schema_v2.sql');

    // Initialiser la base de données
    console.log(`Initializing DatabaseManager with dbPath: ${this.dbPath}`);
    this.db = new Database(this.dbPath);

    // Activer le mode WAL pour de meilleures performances
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');

    // Activer les mémoires tampons pour les écritures
    this.db.pragma('synchronous = NORMAL');

    // Exécuter le schéma
    this.initializeSchema();

    // Préparer les requêtes fréquentes
    this.prepareStatements();

    console.log('DatabaseManager initialized with schema v2');
  }

  /**
   * Initialiser le schéma de la base de données
   */
  initializeSchema() {
    try {
      const schema = fs.readFileSync(this.schemaPath, 'utf8');
      this.db.exec(schema);
      console.log('Database schema v2 initialized');
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  /**
   * Préparer les requêtes fréquentes pour de meilleures performances
   */
  prepareStatements() {
    // CRUD pour les entités
    this.stmts = {
      // Création
      insertEntity: this.db.prepare(`
        INSERT INTO entities (id, type, owner_id)
        VALUES (?, ?, ?)
      `),

      // Lecture
      getEntity: this.db.prepare(`
        SELECT * FROM entities WHERE id = ?
      `),

      // Mise à jour (Upsert)
      upsertEntity: this.db.prepare(`
        INSERT INTO entities (id, type, owner_id)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          owner_id = excluded.owner_id,
          updated_at = CURRENT_TIMESTAMP
      `),

      // Suppression
      deleteEntity: this.db.prepare(`
        DELETE FROM entities WHERE id = ?
      `),

      // Composants Position
      insertPosition: this.db.prepare(`
        INSERT OR REPLACE INTO component_position (entity_id, x, y, z)
        VALUES (?, ?, ?, ?)
      `),

      getPosition: this.db.prepare(`
        SELECT * FROM component_position WHERE entity_id = ?
      `),

      // Composants Economy
      insertEconomy: this.db.prepare(`
        INSERT OR REPLACE INTO component_economy
        (entity_id, resources, production_rate, storage_capacity)
        VALUES (?, ?, ?, ?)
      `),

      getEconomy: this.db.prepare(`
        SELECT * FROM component_economy WHERE entity_id = ?
      `),

      // Composants Combat
      insertCombat: this.db.prepare(`
        INSERT OR REPLACE INTO component_combat
        (entity_id, health, max_health, shield, max_shield, damage, range, fire_rate, armor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      getCombat: this.db.prepare(`
        SELECT * FROM component_combat WHERE entity_id = ?
      `),

      // Composants Fleet
      insertFleet: this.db.prepare(`
        INSERT OR REPLACE INTO component_fleet
        (entity_id, ship_count, ship_capacity, ship_types, speed, formation, target_entity_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),

      getFleet: this.db.prepare(`
        SELECT * FROM component_fleet WHERE entity_id = ?
      `),

      // Autres composants
      insertSovereignty: this.db.prepare(`
        INSERT OR REPLACE INTO component_sovereignty
        (entity_id, owner_id, influence_radius, control_level, contested)
        VALUES (?, ?, ?, ?, ?)
      `),

      insertConstruction: this.db.prepare(`
        INSERT OR REPLACE INTO component_construction
        (entity_id, is_under_construction, construction_progress,
         construction_time_remaining, required_resources, construction_queue)
        VALUES (?, ?, ?, ?, ?, ?)
      `),

      insertLogistics: this.db.prepare(`
        INSERT OR REPLACE INTO component_logistics
        (entity_id, is_logistics_hub, connected_entities, supply_capacity,
         current_supply, transfer_rate)
        VALUES (?, ?, ?, ?, ?, ?)
      `),

      insertRoad: this.db.prepare(`
        INSERT OR REPLACE INTO component_road
        (entity_id, start_entity_id, end_entity_id, distance, travel_time, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
    };
  }

  /**
   * Obtenir une entité complète avec tous ses composants
   */
  getEntity(entityId, options = {}) {
    const { includeComponents = true } = options;

    try {
      const entity = this.stmts.getEntity.get(entityId);

      if (!entity) {
        return null;
      }

      const result = {
        id: entity.id,
        type: entity.type,
        owner_id: entity.owner_id,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        components: {}
      };

      if (includeComponents) {
        // Charger tous les composants
        const position = this.stmts.getPosition.get(entityId);
        if (position) {
          result.components.Position = {
            x: position.x,
            y: position.y,
            z: position.z
          };
        }

        const economy = this.stmts.getEconomy.get(entityId);
        if (economy) {
          const resources = JSON.parse(economy.resources || '{}');
          result.components.Economy = {
            metal: resources.metal || 0,
            energy: resources.energy || 0,
            credits: resources.credits || 0,
            production: JSON.parse(economy.production_rate || '{"metal":0,"energy":0,"credits":0}'),
            storage: JSON.parse(economy.storage_capacity || '{}')
          };
        }

        const combat = this.stmts.getCombat.get(entityId);
        if (combat) {
          result.components.Combat = {
            health: combat.health,
            max_health: combat.max_health,
            shield: combat.shield,
            max_shield: combat.max_shield,
            damage: combat.damage,
            range: combat.range,
            fire_rate: combat.fire_rate,
            armor: combat.armor
          };
        }

        const fleet = this.stmts.getFleet.get(entityId);
        if (fleet) {
          result.components.Fleet = {
            ship_count: fleet.ship_count,
            ship_capacity: fleet.ship_capacity,
            ship_types: JSON.parse(fleet.ship_types || '{}'),
            speed: fleet.speed,
            formation: fleet.formation,
            target_entity_id: fleet.target_entity_id
          };
        }
      }

      return result;
    } catch (error) {
      console.error(`Error getting entity ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir plusieurs entités en batch
   */
  getEntities(entityIds, options = {}) {
    const results = {};

    for (const id of entityIds) {
      results[id] = this.getEntity(id, options);
    }

    return results;
  }

  /**
   * Créer une nouvelle entité
   */
  createEntity(entityData) {
    const { id, type, owner_id, components = {} } = entityData;

    try {
      // Démarrer une transaction
      const transaction = this.db.transaction(() => {
        // Insérer l'entité de base
        let entityId;
        if (id !== undefined) {
          this.stmts.insertEntity.run(id, type, owner_id);
          entityId = id;
        } else {
          // Fallback si pas d'ID fourni (ne devrait pas arriver en ECS)
          const result = this.db.prepare('INSERT INTO entities (type, owner_id) VALUES (?, ?)').run(type, owner_id);
          entityId = result.lastInsertRowid;
        }

        // Insérer les composants
        if (components.Position) {
          const pos = components.Position;
          this.stmts.insertPosition.run(entityId, pos.x, pos.y, pos.z);
        }

        if (components.Economy) {
          const eco = components.Economy;
          this.stmts.insertEconomy.run(
            entityId,
            JSON.stringify(eco.resources || {}),
            JSON.stringify(eco.production_rate || {}),
            JSON.stringify(eco.storage_capacity || {})
          );
        }

        if (components.Combat) {
          const com = components.Combat;
          this.stmts.insertCombat.run(
            entityId,
            com.health || 100,
            com.max_health || 100,
            com.shield || 0,
            com.max_shield || 0,
            com.damage || 10,
            com.range || 100,
            com.fire_rate || 1.0,
            com.armor || 0
          );
        }

        if (components.Fleet) {
          const fleet = components.Fleet;
          this.stmts.insertFleet.run(
            entityId,
            fleet.ship_count || 0,
            fleet.ship_capacity || 10,
            JSON.stringify(fleet.ship_types || {}),
            fleet.speed || 1.0,
            fleet.formation || 'default',
            fleet.target_entity_id || null
          );
        }

        return entityId;
      });

      const entityId = transaction();
      return this.getEntity(entityId);

    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une entité
   */
  updateEntity(entityId, entityData) {
    const { type, owner_id, components = {} } = entityData;

    try {
      // Mettre à jour ou insérer l'entité de base
      const finalOwnerId = (owner_id === 0 || owner_id === undefined) ? null : owner_id;
      this.stmts.upsertEntity.run(entityId, type || 'unknown', finalOwnerId);

      // Mettre à jour les composants
      if (components.Position) {
        const pos = components.Position;
        this.stmts.insertPosition.run(entityId, pos.x, pos.y, pos.z);
      }

      if (components.Economy) {
        const eco = components.Economy;
        this.stmts.insertEconomy.run(
          entityId,
          JSON.stringify({ metal: eco.metal, energy: eco.energy, credits: eco.credits }),
          JSON.stringify(eco.production || {}),
          JSON.stringify(eco.storage || {})
        );
      }

      if (components.Combat) {
        const com = components.Combat;
        this.stmts.insertCombat.run(
          entityId,
          com.health || 100,
          com.max_health || 100,
          com.shield || 0,
          com.max_shield || 0,
          com.damage || 10,
          com.range || 100,
          com.fire_rate || 1.0,
          com.armor || 0
        );
      }

      if (components.Fleet) {
        const fleet = components.Fleet;
        this.stmts.insertFleet.run(
          entityId,
          fleet.ship_count || 0,
          fleet.ship_capacity || 10,
          JSON.stringify(fleet.ship_types || {}),
          fleet.speed || 1.0,
          fleet.formation || 'default',
          fleet.target_entity_id || null
        );
      }

      return this.getEntity(entityId);
    } catch (error) {
      console.error(`Error updating entity ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour plusieurs entités en batch
   */
  updateEntitiesBatch(updates) {
    try {
      const transaction = this.db.transaction(() => {
        for (const [entityId, entityData] of updates) {
          if (entityData) {
            this.updateEntity(parseInt(entityId), entityData);
          }
        }
      });

      transaction();
      return { success: true, count: updates.size };
    } catch (error) {
      console.error('Error updating entities batch:', error);
      throw error;
    }
  }

  /**
   * Supprimer une entité
   */
  deleteEntity(entityId) {
    try {
      this.stmts.deleteEntity.run(entityId);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting entity ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * REQUÊTES SPATIALES
   */

  /**
   * Trouver des entités dans un rayon
   */
  findEntitiesInRadius(centerX, centerZ, radius, options = {}) {
    const { type = null, owner_id = null } = options;

    try {
      let query = `
        SELECT e.*, cp.x, cp.z
        FROM entities e
        JOIN component_position cp ON e.id = cp.entity_id
        WHERE (cp.x - ?) * (cp.x - ?) + (cp.z - ?) * (cp.z - ?) <= ? * ?
      `;

      const params = [centerX, centerX, centerZ, centerZ, radius, radius];

      if (type) {
        query += ' AND e.type = ?';
        params.push(type);
      }

      if (owner_id) {
        query += ' AND e.owner_id = ?';
        params.push(owner_id);
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params);

      return rows;
    } catch (error) {
      console.error('Error in spatial query (radius):', error);
      throw error;
    }
  }

  /**
   * Trouver des entités dans un rectangle
   */
  findEntitiesInRect(minX, minZ, maxX, maxZ, options = {}) {
    const { type = null, owner_id = null } = options;

    try {
      let query = `
        SELECT e.*, cp.x, cp.z
        FROM entities e
        JOIN component_position cp ON e.id = cp.entity_id
        WHERE cp.x BETWEEN ? AND ?
        AND cp.z BETWEEN ? AND ?
      `;

      const params = [minX, maxX, minZ, maxZ];

      if (type) {
        query += ' AND e.type = ?';
        params.push(type);
      }

      if (owner_id) {
        query += ' AND e.owner_id = ?';
        params.push(owner_id);
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params);

      return rows;
    } catch (error) {
      console.error('Error in spatial query (rect):', error);
      throw error;
    }
  }

  /**
   * Trouver l'entité la plus proche
   */
  findNearestEntity(x, z, options = {}) {
    const { type = null, maxDistance = null } = options;

    try {
      let query = `
        SELECT e.*, cp.x, cp.z,
               ((cp.x - ?) * (cp.x - ?) + (cp.z - ?) * (cp.z - ?)) as distance_sq
        FROM entities e
        JOIN component_position cp ON e.id = cp.entity_id
      `;

      const params = [x, x, z, z];

      if (type) {
        query += ' WHERE e.type = ?';
        params.push(type);
      }

      query += ' ORDER BY distance_sq ASC LIMIT 1';

      const stmt = this.db.prepare(query);
      const row = stmt.get(...params);

      if (row && maxDistance) {
        const distance = Math.sqrt(row.distance_sq);
        if (distance > maxDistance) {
          return null;
        }
        row.distance = distance;
      }

      return row;
    } catch (error) {
      console.error('Error in nearest entity query:', error);
      throw error;
    }
  }

  /**
   * REQUÊTES SPÉCIALISÉES
   */

  /**
   * Créer ou mettre à jour un joueur
   */
  createPlayer(username, email = null) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO players (username, email)
        VALUES (?, ?)
        ON CONFLICT(username) DO UPDATE SET last_login = CURRENT_TIMESTAMP
        RETURNING id
      `);
      return stmt.get(username, email);
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les entités (pour l'initialisation du monde)
   */
  getAllEntitiesSync(options = {}) {
    const { includeComponents = true } = options;

    try {
      const stmt = this.db.prepare('SELECT id FROM entities');
      const rows = stmt.all();

      const results = [];
      for (const row of rows) {
        results.push(this.getEntity(row.id, { includeComponents }));
      }

      return results;
    } catch (error) {
      console.error('Error getting all entities:', error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les entités d'un type spécifique
   */
  getEntitiesByType(type, options = {}) {
    const { includeComponents = false } = options;

    try {
      const stmt = this.db.prepare('SELECT * FROM entities WHERE type = ?');
      const rows = stmt.all(type);

      if (includeComponents) {
        const results = [];
        for (const row of rows) {
          results.push(this.getEntity(row.id, { includeComponents: true }));
        }
        return results;
      }

      return rows;
    } catch (error) {
      console.error(`Error getting entities by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les entités d'un joueur
   */
  getEntitiesByOwner(ownerId, options = {}) {
    const { includeComponents = false } = options;

    try {
      const stmt = this.db.prepare('SELECT * FROM entities WHERE owner_id = ?');
      const rows = stmt.all(ownerId);

      if (includeComponents) {
        const results = [];
        for (const row of rows) {
          results.push(this.getEntity(row.id, { includeComponents: true }));
        }
        return results;
      }

      return rows;
    } catch (error) {
      console.error(`Error getting entities by owner ${ownerId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les métriques de la base de données
   */
  getMetrics() {
    try {
      const entityCount = this.db.prepare('SELECT COUNT(*) as count FROM entities').get();
      const positionCount = this.db.prepare('SELECT COUNT(*) as count FROM component_position').get();
      const combatCount = this.db.prepare('SELECT COUNT(*) as count FROM component_combat').get();

      return {
        totalEntities: entityCount.count,
        entitiesWithPosition: positionCount.count,
        entitiesWithCombat: combatCount.count,
        databaseSize: fs.statSync(this.dbPath).size
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      return {};
    }
  }

  /**
   * Exécuter une requête personnalisée
   */
  exec(query, params = []) {
    try {
      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('Error executing custom query:', error);
      throw error;
    }
  }

  /**
   * Fermer la connexion à la base de données
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}
