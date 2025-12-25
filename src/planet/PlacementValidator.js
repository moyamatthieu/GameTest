import * as THREE from 'three';

/**
 * PlacementValidator - Validation intelligente du placement de bâtiments
 *
 * Vérifie tous les critères pour un placement valide :
 * - Pente du terrain
 * - Occupation de la grille
 * - Ressources disponibles
 * - Proximité d'autres bâtiments
 * - Biome approprié
 */
export class PlacementValidator {
  constructor(planetGenerator, buildingGrid, options = {}) {
    this.planetGenerator = planetGenerator;
    this.buildingGrid = buildingGrid;

    // Règles de placement par type de bâtiment
    this.buildingRules = {
      base: {
        maxSlope: 15,
        minSpace: 2,
        allowedBiomes: ['plain', 'hill'],
        requiresFlat: true
      },
      habitation: {
        maxSlope: 20,
        minSpace: 1,
        allowedBiomes: ['plain', 'hill'],
        requiresFlat: false
      },
      mine: {
        maxSlope: 35,
        minSpace: 1,
        allowedBiomes: ['mountain', 'hill'],
        requiresFlat: false,
        preferredHeight: 8 // Préfère les hauteurs
      },
      ferme: {
        maxSlope: 10,
        minSpace: 1,
        allowedBiomes: ['plain'],
        requiresFlat: true
      },
      usine: {
        maxSlope: 15,
        minSpace: 1,
        allowedBiomes: ['plain', 'hill'],
        requiresFlat: true
      },
      centrale: {
        maxSlope: 20,
        minSpace: 2,
        allowedBiomes: ['plain', 'hill'],
        requiresFlat: false
      },
      entrepot: {
        maxSlope: 15,
        minSpace: 1,
        allowedBiomes: ['plain', 'hill'],
        requiresFlat: true
      },
      route: {
        maxSlope: 30,
        minSpace: 0,
        allowedBiomes: ['plain', 'hill', 'mountain'],
        requiresFlat: false,
        canOverlap: true
      }
    };
  }

  /**
   * Valide un placement complet
   * Retourne { valid: boolean, reason: string, data: object }
   */
  validate(position, buildingType, playerResources) {
    const result = {
      valid: true,
      reasons: [],
      warnings: [],
      data: {}
    };

    // 1. Obtenir les données du terrain
    const terrainData = this.planetGenerator.getTerrainDataAt(position);
    if (!terrainData) {
      return {
        valid: false,
        reasons: ['Impossible d\'obtenir les données du terrain'],
        warnings: [],
        data: {}
      };
    }

    result.data.terrainData = terrainData;
    result.data.slope = terrainData.slope;
    result.data.height = terrainData.height;

    // 2. Déterminer le biome
    const biome = this.planetGenerator.getBiome(terrainData.height, terrainData.slope);
    result.data.biome = biome;

    // 3. Obtenir les règles du bâtiment
    const rules = this.buildingRules[buildingType] || this.buildingRules.base;
    result.data.rules = rules;

    // 4. Vérifier la pente
    if (terrainData.slope > rules.maxSlope) {
      result.valid = false;
      result.reasons.push(
        `Pente trop importante (${terrainData.slope.toFixed(1)}° > ${rules.maxSlope}°)`
      );
    }

    // 5. Vérifier le biome
    if (rules.allowedBiomes && !rules.allowedBiomes.includes(biome)) {
      result.valid = false;
      result.reasons.push(
        `Biome incompatible (${biome}). Requis: ${rules.allowedBiomes.join(', ')}`
      );
    }

    // 6. Vérifier l'occupation de la grille
    const gridCoords = this.buildingGrid.worldToGrid(position);
    result.data.gridCoords = gridCoords;

    if (!rules.canOverlap && this.buildingGrid.isCellOccupied(gridCoords.theta, gridCoords.phi)) {
      result.valid = false;
      result.reasons.push('Emplacement déjà occupé');
    }

    // 7. Vérifier l'espace minimum avec les voisins
    if (rules.minSpace > 0) {
      const neighbors = this.buildingGrid.getNeighborCells(gridCoords.theta, gridCoords.phi);
      let tooClose = false;

      for (const neighbor of neighbors) {
        if (this.buildingGrid.isCellOccupied(neighbor.theta, neighbor.phi)) {
          tooClose = true;
          break;
        }
      }

      if (tooClose && rules.minSpace > 1) {
        result.valid = false;
        result.reasons.push('Trop proche d\'un autre bâtiment');
      } else if (tooClose) {
        result.warnings.push('Proche d\'un autre bâtiment');
      }
    }

    // 8. Vérifier les ressources
    const cost = this.getBuildingCost(buildingType);
    result.data.cost = cost;

    if (playerResources) {
      for (const [resource, amount] of Object.entries(cost)) {
        if ((playerResources[resource] || 0) < amount) {
          result.valid = false;
          result.reasons.push(
            `Ressources insuffisantes: ${resource} (${playerResources[resource] || 0}/${amount})`
          );
        }
      }
    }

    // 9. Vérifications spéciales selon le type
    if (rules.requiresFlat && terrainData.slope > 5) {
      result.warnings.push('Terrain pas parfaitement plat, mais acceptable');
    }

    if (rules.preferredHeight && Math.abs(terrainData.height - rules.preferredHeight) > 5) {
      result.warnings.push('Hauteur non optimale pour ce type de bâtiment');
    }

    // 10. Calculer un score de qualité (0-100)
    result.data.qualityScore = this.calculateQualityScore(result.data, rules);

    return result;
  }

  /**
   * Calcule un score de qualité pour le placement (0-100)
   */
  calculateQualityScore(data, rules) {
    let score = 100;

    // Pénalité pour la pente
    const slopeRatio = data.slope / rules.maxSlope;
    score -= slopeRatio * 30;

    // Bonus pour le biome idéal
    if (rules.allowedBiomes && rules.allowedBiomes[0] === data.biome) {
      score += 10;
    }

    // Bonus pour la hauteur préférée
    if (rules.preferredHeight) {
      const heightDiff = Math.abs(data.height - rules.preferredHeight);
      score -= Math.min(heightDiff * 2, 20);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Obtient le coût de construction d'un bâtiment
   */
  getBuildingCost(buildingType) {
    const costs = {
      base: { metal: 100, energy: 50 },
      habitation: { metal: 30 },
      ferme: { metal: 40 },
      usine: { metal: 60, energy: 20 },
      entrepot: { metal: 50 },
      centrale: { metal: 80, energy: 30 },
      mine: { metal: 120 },
      route: { metal: 5 }
    };

    return costs[buildingType] || { metal: 50 };
  }

  /**
   * Trouve le meilleur emplacement près d'une position donnée
   */
  findBestPlacementNearby(targetPosition, buildingType, playerResources, searchRadius = 20) {
    const candidates = [];
    const gridCoords = this.buildingGrid.worldToGrid(targetPosition);

    // Chercher dans un rayon
    const searchSteps = Math.ceil(searchRadius / this.buildingGrid.cellSize);

    for (let dTheta = -searchSteps; dTheta <= searchSteps; dTheta++) {
      for (let dPhi = -searchSteps; dPhi <= searchSteps; dPhi++) {
        const theta = gridCoords.theta + (dTheta * this.buildingGrid.cellSize / this.planetGenerator.radius);
        const phi = gridCoords.phi + (dPhi * this.buildingGrid.cellSize / this.planetGenerator.radius);

        // Vérifier les limites
        if (phi < 0 || phi > Math.PI) continue;

        const worldPos = this.buildingGrid.gridToWorld(theta, phi);
        const validation = this.validate(worldPos, buildingType, playerResources);

        if (validation.valid) {
          candidates.push({
            position: worldPos,
            gridCoords: { theta, phi },
            score: validation.data.qualityScore,
            validation
          });
        }
      }
    }

    // Trier par score de qualité
    candidates.sort((a, b) => b.score - a.score);

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Obtient une visualisation colorée de la validité du placement
   */
  getValidationColor(isValid, qualityScore) {
    if (!isValid) {
      return 0xff0000; // Rouge
    } else if (qualityScore >= 80) {
      return 0x00ff00; // Vert
    } else if (qualityScore >= 60) {
      return 0xffff00; // Jaune
    } else {
      return 0xffa500; // Orange
    }
  }
}
