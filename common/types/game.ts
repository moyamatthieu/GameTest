/**
 * Types et interfaces métier pour le jeu
 */

/**
 * Types d'unités disponibles
 */
export enum UnitType {
  FIGHTER = 'fighter',
  CRUISER = 'cruiser',
  TRANSPORT = 'transport',
  CONSTRUCTION = 'construction'
}

/**
 * États possibles d'une unité
 */
export enum UnitStatus {
  IDLE = 'idle',
  MOVING = 'moving',
  COMBAT = 'combat',
  MINING = 'mining'
}

/**
 * Interface représentant une unité
 */
export interface Unit {
  type: UnitType;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  ownerId: string | null;
  status: UnitStatus;
}

/**
 * Types de bâtiments disponibles
 */
export enum BuildingType {
  BASE = 'base',
  HABITATION = 'habitation',
  FERME = 'ferme',
  USINE = 'usine',
  ENTREPOT = 'entrepot',
  CENTRALE = 'centrale',
  MINE = 'mine',
  LABO = 'labo'
}

/**
 * Interface représentant un bâtiment
 */
export interface Building {
  type: BuildingType;
  level: number;
  active: boolean;
  constructionProgress: number; // Pourcentage de 0 à 100
  production?: {
    resource: string;
    rate: number;
  };
  ownerId: string | null;
}

/**
 * Types de terrain pour les cellules de la grille
 */
export enum TerrainType {
  PLAIN = 'plain',
  MOUNTAIN = 'mountain',
  WATER = 'water'
}

/**
 * Interface représentant une cellule de la grille planétaire
 */
export interface Cell {
  theta: number;
  phi: number;
  terrainType: TerrainType;
  occupiedBy: number | null; // ID de l'entité (Entity)
}

/**
 * Interface représentant la grille d'une planète
 */
export interface Grid {
  planetId: number;
  radius: number;
  cellSize: number;
  cells: Map<string, Cell>; // Clé formatée, ex: "theta,phi"
}
