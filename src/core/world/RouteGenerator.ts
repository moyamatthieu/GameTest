import { ClusterData, GalacticRoute, SystemData } from './types';

export class RouteGenerator {
  /**
   * Generates routes between cluster centers.
   * For this MVP, we connect the centers of adjacent clusters.
   */
  generateInterClusterRoutes(clusters: Map<string, ClusterData>): GalacticRoute[] {
    const routes: GalacticRoute[] = [];
    const clusterList = Array.from(clusters.values());

    for (let i = 0; i < clusterList.length; i++) {
      const c1 = clusterList[i];
      for (let j = i + 1; j < clusterList.length; j++) {
        const c2 = clusterList[j];

        // Check if clusters are adjacent
        const dx = Math.abs(c1.coords.x - c2.coords.x);
        const dy = Math.abs(c1.coords.y - c2.coords.y);

        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
          // Connect their centers
          c1.centers.forEach(s1Id => {
            c2.centers.forEach(s2Id => {
              routes.push({
                startSystemId: s1Id,
                endSystemId: s2Id,
                type: 'InterCluster'
              });
            });
          });
        }
      }
    }

    return routes;
  }

  /**
   * Generates routes within a cluster using a simplified RNG algorithm.
   */
  generateIntraClusterRoutes(systems: SystemData[]): GalacticRoute[] {
    const routes: GalacticRoute[] = [];

    // Simplified RNG: connect each system to its nearest neighbor if not already connected
    // and ensure a basic connectivity.
    // In a real RNG, an edge (u, v) exists if dist(u, v) <= max(dist(u, w), dist(v, w)) for all w.

    for (let i = 0; i < systems.length; i++) {
      for (let j = i + 1; j < systems.length; j++) {
        const u = systems[i];
        const v = systems[j];
        const d_uv = this.dist(u.position, v.position);

        let isRNG = true;
        for (let k = 0; k < systems.length; k++) {
          if (k === i || k === j) continue;
          const w = systems[k];
          const d_uw = this.dist(u.position, w.position);
          const d_vw = this.dist(v.position, w.position);

          if (Math.max(d_uw, d_vw) < d_uv) {
            isRNG = false;
            break;
          }
        }

        if (isRNG) {
          routes.push({
            startSystemId: u.id,
            endSystemId: v.id,
            type: 'InterCluster' // Reusing type for now or could add IntraCluster
          });
        }
      }
    }

    return routes;
  }

  private dist(p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }): number {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) +
      Math.pow(p1.y - p2.y, 2) +
      Math.pow(p1.z - p2.z, 2)
    );
  }
}
