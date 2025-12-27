import { LatticeGenerator } from './LatticeGenerator';
import { RouteGenerator } from './RouteGenerator';
import { UniverseState, ClusterData } from './types';

export class WorldGenerator {
  private latticeGen: LatticeGenerator;
  private routeGen: RouteGenerator;

  constructor(seed: string) {
    this.latticeGen = new LatticeGenerator(seed);
    this.routeGen = new RouteGenerator();
  }

  /**
   * Generates the initial state of the universe.
   * For the MVP, we generate a 10x10 grid of clusters.
   */
  generateUniverse(seed: string): UniverseState {
    const clusters = new Map<string, ClusterData>();
    const systemToCluster = new Map<string, ClusterData>();

    // Generate clusters and their systems
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const cluster = this.latticeGen.generateCluster(x, y);
        clusters.set(`${x},${y}`, cluster);
        cluster.systems.forEach(s => systemToCluster.set(s.id, cluster));
      }
    }

    // Generate inter-cluster routes
    const interClusterRoutes = this.routeGen.generateInterClusterRoutes(clusters);

    // Distribute routes back to clusters
    interClusterRoutes.forEach(route => {
      const cluster = systemToCluster.get(route.startSystemId);
      if (cluster) {
        cluster.routes.push(route);
      }
    });

    return {
      seed,
      clusters
    };
  }
}
