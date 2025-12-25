import * as THREE from 'three';
import { IPlanetGenerator } from './BuildingGrid';
import { BuildingGrid } from './BuildingGrid';

interface BuildingRule {
  maxSlope: number;
  minSpace: number;
  allowedBiomes: string[];
  requiresFlat: boolean;
  preferredHeight?: number;
  canOverlap?: boolean;
}

export class PlacementValidator {
  private planetGenerator: IPlanetGenerator;
  private buildingGrid: BuildingGrid;
  private buildingRules: Record<string, BuildingRule>;

  constructor(planetGenerator: IPlanetGenerator, buildingGrid: BuildingGrid) {
    this.planetGenerator = planetGenerator;
    this.buildingGrid = buildingGrid;
    this.buildingRules = {
      base: { maxSlope: 15, minSpace: 2, allowedBiomes: ['plain', 'hill'], requiresFlat: true },
      habitation: { maxSlope: 20, minSpace: 1, allowedBiomes: ['plain', 'hill'], requiresFlat: false },
      mine: { maxSlope: 35, minSpace: 1, allowedBiomes: ['mountain', 'hill'], requiresFlat: false, preferredHeight: 8 },
      ferme: { maxSlope: 10, minSpace: 1, allowedBiomes: ['plain'], requiresFlat: true },
      usine: { maxSlope: 15, minSpace: 1, allowedBiomes: ['plain', 'hill'], requiresFlat: true },
      centrale: { maxSlope: 20, minSpace: 2, allowedBiomes: ['plain', 'hill'], requiresFlat: false },
      entrepot: { maxSlope: 15, minSpace: 1, allowedBiomes: ['plain', 'hill'], requiresFlat: true },
      route: { maxSlope: 30, minSpace: 0, allowedBiomes: ['plain', 'hill', 'mountain'], requiresFlat: false, canOverlap: true }
    };
  }

  validate(position: THREE.Vector3, buildingType: string, playerResources: any): any {
    const result: any = { valid: true, reasons: [], warnings: [], data: {} };
    const terrainData = this.planetGenerator.getTerrainDataAt(position);
    if (!terrainData) return { valid: false, reasons: ['Impossible d\'obtenir les données du terrain'], warnings: [], data: {} };

    result.data.terrainData = terrainData;
    result.data.slope = terrainData.slope;
    result.data.height = terrainData.height;

    const biome = (this.planetGenerator as any).getBiome(terrainData.height, terrainData.slope);
    result.data.biome = biome;

    const rules = this.buildingRules[buildingType] || this.buildingRules.base;
    result.data.rules = rules;

    if (terrainData.slope > rules.maxSlope) {
      result.valid = false;
      result.reasons.push(`Pente trop importante (${terrainData.slope.toFixed(1)}° > ${rules.maxSlope}°)`);
    }

    if (rules.allowedBiomes && !rules.allowedBiomes.includes(biome)) {
      result.valid = false;
      result.reasons.push(`Biome incompatible (${biome}). Requis: ${rules.allowedBiomes.join(', ')}`);
    }

    const gridCoords = this.buildingGrid.worldToGrid(position);
    result.data.gridCoords = gridCoords;

    if (!rules.canOverlap && this.buildingGrid.isCellOccupied(gridCoords.theta, gridCoords.phi)) {
      result.valid = false;
      result.reasons.push('Emplacement déjà occupé');
    }

    const cost = this.getBuildingCost(buildingType);
    result.data.cost = cost;

    if (playerResources) {
      for (const [resource, amount] of Object.entries(cost)) {
        if ((playerResources[resource] || 0) < (amount as number)) {
          result.valid = false;
          result.reasons.push(`Ressources insuffisantes: ${resource} (${playerResources[resource] || 0}/${amount})`);
        }
      }
    }

    result.data.qualityScore = this.calculateQualityScore(result.data, rules);
    return result;
  }

  calculateQualityScore(data: any, rules: BuildingRule): number {
    let score = 100;
    score -= (data.slope / rules.maxSlope) * 30;
    if (rules.allowedBiomes && rules.allowedBiomes[0] === data.biome) score += 10;
    if (rules.preferredHeight) {
      const heightDiff = Math.abs(data.height - rules.preferredHeight);
      score -= Math.min(heightDiff * 2, 20);
    }
    return Math.max(0, Math.min(100, score));
  }

  getBuildingCost(buildingType: string): any {
    const costs: any = {
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

  getValidationColor(isValid: boolean, qualityScore: number): number {
    if (!isValid) return 0xff0000;
    if (qualityScore >= 80) return 0x00ff00;
    if (qualityScore >= 60) return 0xffff00;
    return 0xffa500;
  }
}
