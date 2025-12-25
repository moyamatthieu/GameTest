-- =============================================
-- SCHÉMA V2 : Structure Granulaire Normalisée
-- =============================================

-- Table principale des entités (informations de base)
CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  owner_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES players(id)
);

-- Table des joueurs
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Composant Position (séparé pour indexation spatiale)
CREATE TABLE IF NOT EXISTS component_position (
  entity_id INTEGER PRIMARY KEY,
  x REAL NOT NULL,
  y REAL NOT NULL,
  z REAL NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Composant Economy
CREATE TABLE IF NOT EXISTS component_economy (
  entity_id INTEGER PRIMARY KEY,
  resources TEXT NOT NULL, -- JSON: {metal: 100, crystal: 50, ...}
  production_rate TEXT, -- JSON: {metal: 10, crystal: 5, ...}
  storage_capacity TEXT, -- JSON: {metal: 1000, crystal: 500, ...}
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Composant Combat
CREATE TABLE IF NOT EXISTS component_combat (
  entity_id INTEGER PRIMARY KEY,
  health INTEGER NOT NULL DEFAULT 100,
  max_health INTEGER NOT NULL DEFAULT 100,
  shield INTEGER DEFAULT 0,
  max_shield INTEGER DEFAULT 0,
  damage INTEGER DEFAULT 10,
  range REAL DEFAULT 100,
  fire_rate REAL DEFAULT 1.0,
  armor INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Composant Fleet
CREATE TABLE IF NOT EXISTS component_fleet (
  entity_id INTEGER PRIMARY KEY,
  ship_count INTEGER NOT NULL DEFAULT 0,
  ship_capacity INTEGER NOT NULL DEFAULT 10,
  ship_types TEXT, -- JSON: {fighter: 10, bomber: 5, ...}
  speed REAL DEFAULT 1.0,
  formation TEXT DEFAULT 'default',
  target_entity_id INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY(target_entity_id) REFERENCES entities(id)
);

-- Composant Construction
CREATE TABLE IF NOT EXISTS component_construction (
  entity_id INTEGER PRIMARY KEY,
  is_under_construction BOOLEAN DEFAULT 0,
  construction_progress REAL DEFAULT 0.0,
  construction_time_remaining REAL DEFAULT 0.0,
  required_resources TEXT, -- JSON: {metal: 100, crystal: 50, ...}
  construction_queue TEXT, -- JSON: [{type: 'building', time: 10}, ...]
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Composant Sovereignty
CREATE TABLE IF NOT EXISTS component_sovereignty (
  entity_id INTEGER PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  influence_radius REAL DEFAULT 100,
  control_level INTEGER DEFAULT 1,
  contested BOOLEAN DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY(owner_id) REFERENCES players(id)
);

-- Composant Logistics
CREATE TABLE IF NOT EXISTS component_logistics (
  entity_id INTEGER PRIMARY KEY,
  is_logistics_hub BOOLEAN DEFAULT 0,
  connected_entities TEXT, -- JSON: [entity_id1, entity_id2, ...]
  supply_capacity REAL DEFAULT 1000,
  current_supply REAL DEFAULT 0,
  transfer_rate REAL DEFAULT 10,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Composant Road
CREATE TABLE IF NOT EXISTS component_road (
  entity_id INTEGER PRIMARY KEY,
  start_entity_id INTEGER NOT NULL,
  end_entity_id INTEGER NOT NULL,
  distance REAL NOT NULL,
  travel_time REAL NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY(start_entity_id) REFERENCES entities(id),
  FOREIGN KEY(end_entity_id) REFERENCES entities(id)
);

-- =============================================
-- INDEXATION SPATIALE ET PERFORMANCE
-- =============================================

-- Index spatial sur les coordonnées (x, z) pour les requêtes de proximité
CREATE INDEX IF NOT EXISTS idx_position_spatial ON component_position(x, z);

-- Index sur la position y pour les requêtes de hauteur
CREATE INDEX IF NOT EXISTS idx_position_y ON component_position(y);

-- Index sur le type d'entité (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_entity_type ON entities(type);

-- Index sur le propriétaire (requêtes par joueur)
CREATE INDEX IF NOT EXISTS idx_entity_owner ON entities(owner_id);

-- Index sur les entités mises à jour récemment
CREATE INDEX IF NOT EXISTS idx_entity_updated ON entities(updated_at);

-- Index sur les composants de combat (santé, bouclier)
CREATE INDEX IF NOT EXISTS idx_combat_health ON component_combat(health, shield);

-- Index sur les flottes (capacité, nombre de vaisseaux)
CREATE INDEX IF NOT EXISTS idx_fleet_capacity ON component_fleet(ship_count, ship_capacity);

-- Index sur la souveraineté (propriétaire et niveau de contrôle)
CREATE INDEX IF NOT EXISTS idx_sovereignty_owner ON component_sovereignty(owner_id, control_level);

-- Index sur les routes (connexions entre entités)
CREATE INDEX IF NOT EXISTS idx_road_connections ON component_road(start_entity_id, end_entity_id);

-- =============================================
-- TRIGGERS POUR MAINTENIR LA COHÉRENCE
-- =============================================

-- Mettre à jour updated_at lors de la modification d'une entité
CREATE TRIGGER IF NOT EXISTS trg_entities_updated_at
AFTER UPDATE ON entities
FOR EACH ROW
BEGIN
  UPDATE entities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Mettre à jour updated_at lors de la modification de la position
CREATE TRIGGER IF NOT EXISTS trg_position_updated_at
AFTER UPDATE ON component_position
FOR EACH ROW
BEGIN
  UPDATE component_position SET updated_at = CURRENT_TIMESTAMP WHERE entity_id = NEW.entity_id;
END;

-- Mettre à jour updated_at lors de la modification de l'économie
CREATE TRIGGER IF NOT EXISTS trg_economy_updated_at
AFTER UPDATE ON component_economy
FOR EACH ROW
BEGIN
  UPDATE component_economy SET updated_at = CURRENT_TIMESTAMP WHERE entity_id = NEW.entity_id;
END;

-- Mettre à jour updated_at lors de la modification du combat
CREATE TRIGGER IF NOT EXISTS trg_combat_updated_at
AFTER UPDATE ON component_combat
FOR EACH ROW
BEGIN
  UPDATE component_combat SET updated_at = CURRENT_TIMESTAMP WHERE entity_id = NEW.entity_id;
END;

-- Mettre à jour updated_at lors de la modification de la flotte
CREATE TRIGGER IF NOT EXISTS trg_fleet_updated_at
AFTER UPDATE ON component_fleet
FOR EACH ROW
BEGIN
  UPDATE component_fleet SET updated_at = CURRENT_TIMESTAMP WHERE entity_id = NEW.entity_id;
END;

-- =============================================
-- VUES POUR FACILITER LES REQUÊTES
-- =============================================

-- Vue complète des entités avec toutes leurs composantes
CREATE VIEW IF NOT EXISTS v_entities_complete AS
SELECT
  e.id,
  e.type,
  e.owner_id,
  p.username as owner_name,
  cp.x, cp.y, cp.z,
  ce.resources as economy_resources,
  ce.production_rate as economy_production,
  cc.health, cc.max_health, cc.shield, cc.max_shield, cc.damage,
  cf.ship_count, cf.ship_capacity, cf.ship_types, cf.speed,
  cs.owner_id as sovereign_owner_id,
  cs.influence_radius,
  cs.control_level,
  e.updated_at
FROM entities e
LEFT JOIN players p ON e.owner_id = p.id
LEFT JOIN component_position cp ON e.id = cp.entity_id
LEFT JOIN component_economy ce ON e.id = ce.entity_id
LEFT JOIN component_combat cc ON e.id = cc.entity_id
LEFT JOIN component_fleet cf ON e.id = cf.entity_id
LEFT JOIN component_sovereignty cs ON e.id = cs.entity_id;

-- Vue des entités dans une zone (pour requêtes spatiales)
CREATE VIEW IF NOT EXISTS v_entities_in_zone AS
SELECT
  e.id,
  e.type,
  e.owner_id,
  cp.x, cp.y, cp.z,
  cc.health,
  cc.shield
FROM entities e
JOIN component_position cp ON e.id = cp.entity_id
LEFT JOIN component_combat cc ON e.id = cc.entity_id;
