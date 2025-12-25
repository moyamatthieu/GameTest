/**
 * Interest Manager - Gestion de l'Area of Interest (AOI)
 * Utilise le spatial hashing pour optimiser les envois de données aux joueurs
 * Ne transmet que les entités visibles/pertinentes pour chaque joueur
 */
export class InterestManager {
  constructor(cellSize = 1000) {
    this.cellSize = cellSize; // Taille des cellules de la grille
    this.grid = new Map(); // Map des cellules : key -> Set d'entités
    this.playerPositions = new Map(); // playerId -> {x, y, z}
    this.entityPositions = new Map(); // entityId -> {x, y, z, data}
    this.playerInterests = new Map(); // playerId -> Set d'entités d'intérêt

    this.metrics = {
      totalEntities: 0,
      entitiesSent: 0,
      reductionRatio: 0,
      updates: 0
    };
  }

  /**
   * Convertit une position en clé de cellule de grille
   * @param {number} x - Coordonnée X
   * @param {number} y - Coordonnée Y
   * @param {number} z - Coordonnée Z
   * @returns {string} Clé de la cellule
   */
  getCellKey(x, y, z) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Récupère les clés des cellules voisines (pour l'AOI)
   * @param {string} cellKey - Clé de la cellule centrale
   * @returns {string[]} Liste des clés des cellules voisines
   */
  getNeighborCells(cellKey) {
    const [cx, cy, cz] = cellKey.split(',').map(Number);
    const neighbors = [];

    // 3x3x3 grid around the center cell
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          neighbors.push(`${cx + x},${cy + y},${cz + z}`);
        }
      }
    }

    return neighbors;
  }

  /**
   * Met à jour la position d'un joueur
   * @param {string} playerId - ID du joueur
   * @param {Object} position - Position {x, y, z}
   */
  updatePlayerPosition(playerId, position) {
    const oldPosition = this.playerPositions.get(playerId);
    this.playerPositions.set(playerId, position);

    // Si la position a changé, mettre à jour les intérêts
    if (!oldPosition ||
        oldPosition.x !== position.x ||
        oldPosition.y !== position.y ||
        oldPosition.z !== position.z) {
      this.updatePlayerInterest(playerId);
    }
  }

  /**
   * Ajoute ou met à jour une entité
   * @param {string} entityId - ID de l'entité
   * @param {Object} position - Position {x, y, z}
   * @param {Object} data - Données de l'entité
   */
  updateEntity(entityId, position, data) {
    const oldPosition = this.entityPositions.get(entityId);

    // Supprimer l'ancienne position de la grille
    if (oldPosition) {
      const oldCellKey = this.getCellKey(oldPosition.x, oldPosition.y, oldPosition.z);
      const oldCell = this.grid.get(oldCellKey);
      if (oldCell) {
        oldCell.delete(entityId);
        if (oldCell.size === 0) {
          this.grid.delete(oldCellKey);
        }
      }
    }

    // Ajouter la nouvelle position
    this.entityPositions.set(entityId, { ...position, data });
    const cellKey = this.getCellKey(position.x, position.y, position.z);

    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set());
    }
    this.grid.get(cellKey).add(entityId);

    // Mettre à jour les intérêts des joueurs concernés
    this.updateInterestsForEntity(entityId, position);
  }

  /**
   * Supprime une entité
   * @param {string} entityId - ID de l'entité
   */
  removeEntity(entityId) {
    const position = this.entityPositions.get(entityId);
    if (!position) return;

    const cellKey = this.getCellKey(position.x, position.y, position.z);
    const cell = this.grid.get(cellKey);
    if (cell) {
      cell.delete(entityId);
      if (cell.size === 0) {
        this.grid.delete(cellKey);
      }
    }

    this.entityPositions.delete(entityId);

    // Retirer des intérêts de tous les joueurs
    for (const interests of this.playerInterests.values()) {
      interests.delete(entityId);
    }
  }

  /**
   * Met à jour les intérêts d'un joueur
   * @param {string} playerId - ID du joueur
   */
  updatePlayerInterest(playerId) {
    const position = this.playerPositions.get(playerId);
    if (!position) return;

    const cellKey = this.getCellKey(position.x, position.y, position.z);
    const neighborCells = this.getNeighborCells(cellKey);
    const interests = new Set();

    // Collecter toutes les entités des cellules voisines
    for (const cell of neighborCells) {
      const entities = this.grid.get(cell);
      if (entities) {
        for (const entityId of entities) {
          interests.add(entityId);
        }
      }
    }

    this.playerInterests.set(playerId, interests);
  }

  /**
   * Met à jour les intérêts pour une entité spécifique
   * @param {string} entityId - ID de l'entité
   * @param {Object} position - Position de l'entité
   */
  updateInterestsForEntity(entityId, position) {
    const cellKey = this.getCellKey(position.x, position.y, position.z);
    const neighborCells = this.getNeighborCells(cellKey);

    // Pour chaque joueur, vérifier si l'entité est dans sa zone d'intérêt
    for (const [playerId, playerPosition] of this.playerPositions) {
      const playerCellKey = this.getCellKey(
        playerPosition.x,
        playerPosition.y,
        playerPosition.z
      );

      // Si le joueur est dans une cellule voisine, ajouter l'entité à ses intérêts
      if (neighborCells.includes(playerCellKey)) {
        const interests = this.playerInterests.get(playerId) || new Set();
        interests.add(entityId);
        this.playerInterests.set(playerId, interests);
      } else {
        // Sinon, retirer l'entité si elle était précédemment intéressante
        const interests = this.playerInterests.get(playerId);
        if (interests) {
          interests.delete(entityId);
        }
      }
    }
  }

  /**
   * Récupère les entités d'intérêt pour un joueur
   * @param {string} playerId - ID du joueur
   * @returns {Object[]} Liste des entités d'intérêt avec leurs données
   */
  getInterestsForPlayer(playerId) {
    const interests = this.playerInterests.get(playerId);
    if (!interests) return [];

    const entities = [];
    for (const entityId of interests) {
      const entityData = this.entityPositions.get(entityId);
      if (entityData) {
        entities.push({
          id: entityId,
          ...entityData
        });
      }
    }

    return entities;
  }

  /**
   * Filtre les entités pour un joueur en fonction de sa position
   * @param {string} playerId - ID du joueur
   * @param {Object[]} allEntities - Toutes les entités
   * @returns {Object[]} Entités filtrées
   */
  filterEntitiesForPlayer(playerId, allEntities) {
    this.metrics.totalEntities = allEntities.length;

    const interests = this.getInterestsForPlayer(playerId);
    const interestIds = new Set(interests.map(e => e.id));

    const filtered = allEntities.filter(entity => interestIds.has(entity.id));

    this.metrics.entitiesSent += filtered.length;
    this.metrics.updates++;
    this.metrics.reductionRatio =
      (1 - filtered.length / Math.max(1, allEntities.length)) * 100;

    return filtered;
  }

  /**
   * Récupère les métriques de performance
   */
  getMetrics() {
    return {
      ...this.metrics,
      reductionRatio: this.metrics.reductionRatio.toFixed(2) + '%',
      averageEntitiesPerUpdate: this.metrics.updates > 0 ?
        (this.metrics.entitiesSent / this.metrics.updates).toFixed(2) : 0,
      activePlayers: this.playerPositions.size,
      trackedEntities: this.entityPositions.size
    };
  }

  /**
   * Supprime un joueur
   * @param {string} playerId - ID du joueur
   */
  removePlayer(playerId) {
    this.playerPositions.delete(playerId);
    this.playerInterests.delete(playerId);
  }

  /**
   * Vide toutes les données
   */
  clear() {
    this.grid.clear();
    this.playerPositions.clear();
    this.entityPositions.clear();
    this.playerInterests.clear();
    this.metrics = {
      totalEntities: 0,
      entitiesSent: 0,
      reductionRatio: 0,
      updates: 0
    };
  }
}
