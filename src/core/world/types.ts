import { ResourceType } from '../economy/types';

export type ViewScale = 'Galaxy' | 'System' | 'Planet';

export type StarType = 'YellowDwarf' | 'RedGiant' | 'BlueGiant' | 'NeutronStar';

export interface UniverseState {
  seed: string;
  clusters: Map<string, ClusterData>; // key: "x,y"
}

export interface ClusterData {
  id: string; // "cluster-x-y"
  coords: { x: number; y: number };
  systems: SystemData[]; // Exactly 10
  centers: string[]; // IDs of 1-2 center systems
  routes: GalacticRoute[]; // Connections to adjacent cluster centers
}

export interface SystemData {
  id: string;
  name: string;
  starType: StarType;
  position: { x: number; y: number; z: number }; // Relative to cluster center
  planets: PlanetData[];
}

export interface PlanetData {
  id: string;
  name: string;
  radius: number;
  orbitDistance: number;
  color: number; // Hex color
  heightmapSeed: string;
  resourceDensitySeeds: Partial<Record<ResourceType, string>>;
  spaceGrid: { radius: number; resolution: number };
}

export interface GalacticRoute {
  startSystemId: string;
  endSystemId: string;
  type: 'InterCluster';
}
