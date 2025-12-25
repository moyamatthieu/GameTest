import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface EntityDBRow {
  id: number;
  type: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMetrics {
  totalEntities: number;
  entitiesWithPosition: number;
  entitiesWithCombat: number;
  databaseSize: number;
}

/**
 * DatabaseManager - Interface unique pour toutes les opérations CRUD
 */
export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;
  private schemaPath: string;
  private stmts: Record<string, Database.Statement>;

  constructor(dbPath: string | null = null, schemaPath: string | null = null) {
    this.dbPath = dbPath || path.join(__dirname, '../game_debug_123.sqlite');
    this.schemaPath = schemaPath || path.join(__dirname, 'schema_v2.sql');

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('synchronous = NORMAL');

    this.initializeSchema();
    this.stmts = {};
    this.prepareStatements();
  }

  private initializeSchema(): void {
    try {
      const schema = fs.readFileSync(this.schemaPath, 'utf8');
      this.db.exec(schema);
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  private prepareStatements(): void {
    this.stmts = {
      insertEntity: this.db.prepare(`
        INSERT INTO entities (id, type, owner_id)
        VALUES (?, ?, ?)
      `),
      getEntity: this.db.prepare(`
        SELECT * FROM entities WHERE id = ?
      `),
      upsertEntity: this.db.prepare(`
        INSERT INTO entities (id, type, owner_id)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          owner_id = excluded.owner_id,
          updated_at = CURRENT_TIMESTAMP
      `),
      deleteEntity: this.db.prepare(`
        DELETE FROM entities WHERE id = ?
      `),
      insertPosition: this.db.prepare(`
        INSERT OR REPLACE INTO component_position (entity_id, x, y, z)
        VALUES (?, ?, ?, ?)
      `),
      getPosition: this.db.prepare(`
        SELECT * FROM component_position WHERE entity_id = ?
      `),
      insertEconomy: this.db.prepare(`
        INSERT OR REPLACE INTO component_economy
        (entity_id, resources, production_rate, storage_capacity)
        VALUES (?, ?, ?, ?)
      `),
      getEconomy: this.db.prepare(`
        SELECT * FROM component_economy WHERE entity_id = ?
      `),
      insertCombat: this.db.prepare(`
        INSERT OR REPLACE INTO component_combat
        (entity_id, health, max_health, shield, max_shield, damage, range, fire_rate, armor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      getCombat: this.db.prepare(`
        SELECT * FROM component_combat WHERE entity_id = ?
      `),
      insertFleet: this.db.prepare(`
        INSERT OR REPLACE INTO component_fleet
        (entity_id, ship_count, ship_capacity, ship_types, speed, formation, target_entity_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      getFleet: this.db.prepare(`
        SELECT * FROM component_fleet WHERE entity_id = ?
      `)
    };
  }

  getEntity(entityId: number, options: { includeComponents?: boolean } = {}): any {
    const { includeComponents = true } = options;

    try {
      const entity = this.stmts.getEntity.get(entityId) as EntityDBRow;

      if (!entity) {
        return null;
      }

      const result: any = {
        id: entity.id,
        type: entity.type,
        owner_id: entity.owner_id,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        components: {}
      };

      if (includeComponents) {
        const position = this.stmts.getPosition.get(entityId) as any;
        if (position) {
          result.components.Position = { x: position.x, y: position.y, z: position.z };
        }

        const economy = this.stmts.getEconomy.get(entityId) as any;
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

        const combat = this.stmts.getCombat.get(entityId) as any;
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

        const fleet = this.stmts.getFleet.get(entityId) as any;
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

  updateEntity(entityId: number, entityData: any): any {
    const { type, owner_id, components = {} } = entityData;

    try {
      const finalOwnerId = (owner_id === 0 || owner_id === undefined) ? null : owner_id;
      this.stmts.upsertEntity.run(entityId, type || 'unknown', finalOwnerId);

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

  updateEntitiesBatch(updates: Map<number, any>): { success: boolean; count: number } {
    try {
      const transaction = this.db.transaction(() => {
        for (const [entityId, entityData] of updates) {
          if (entityData) {
            this.updateEntity(entityId, entityData);
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

  getMetrics(): DatabaseMetrics | any {
    try {
      const entityCount = this.db.prepare('SELECT COUNT(*) as count FROM entities').get() as any;
      const positionCount = this.db.prepare('SELECT COUNT(*) as count FROM component_position').get() as any;
      const combatCount = this.db.prepare('SELECT COUNT(*) as count FROM component_combat').get() as any;

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

  getAllEntitiesSync(options: { includeComponents?: boolean } = {}): any[] {
    const { includeComponents = true } = options;

    try {
      const stmt = this.db.prepare('SELECT id FROM entities');
      const rows = stmt.all() as { id: number }[];

      const results: any[] = [];
      for (const row of rows) {
        results.push(this.getEntity(row.id, { includeComponents }));
      }

      return results;
    } catch (error) {
      console.error('Error getting all entities:', error);
      throw error;
    }
  }

  createPlayer(username: string, email: string | null = null): any {
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

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}
