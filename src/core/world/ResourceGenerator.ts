import { ResourceType } from '../economy/types';
import { Random } from '../utils/Random';

export class ResourceGenerator {
  /**
   * Calculates resource density for a planet based on its position in the cluster.
   * Center: Basic resources (Iron, Copper, Water).
   * Periphery: Rare resources (Uranium, RareEarth, Titanium).
   */
  public calculateDensity(
    type: ResourceType,
    clusterCoords: { x: number; y: number },
    systemPos: { x: number; y: number; z: number },
    planetSeed: string
  ): number {
    const random = new Random(planetSeed);

    // Distance from cluster center (0,0,0 in local system coords approx)
    const distFromCenter = Math.sqrt(systemPos.x ** 2 + systemPos.y ** 2 + systemPos.z ** 2);
    const maxDist = 700; // Approx max distance in cluster
    const normalizedDist = Math.min(distFromCenter / maxDist, 1.0);

    const basicResources = [ResourceType.IRON, ResourceType.COPPER, ResourceType.WATER];
    const rareResources = [ResourceType.URANIUM, ResourceType.RARE_EARTHS, ResourceType.TITANIUM];

    let baseDensity = random.nextFloat(0.1, 0.5);

    if (basicResources.includes(type)) {
      // Higher density at center
      baseDensity *= (1.0 - normalizedDist * 0.8);
    } else if (rareResources.includes(type)) {
      // Higher density at periphery
      baseDensity *= (0.2 + normalizedDist * 0.8);
    }

    return baseDensity;
  }
}
