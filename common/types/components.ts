import { UnitType, BuildingType } from './game';

export interface PositionData {
  x: number;
  y: number;
  z: number;
  referenceFrame: string;
}

export interface RotationData {
  x: number;
  y: number;
  z: number;
}

export interface VelocityData {
  vx: number;
  vy: number;
  vz: number;
}

export interface RenderableData {
  type: string;
  color: number;
  [key: string]: any;
}

export interface ConstructionContextData {
  mode: 'PLANET' | 'SPACE';
  parentId: number | null;
  snappingData: Record<string, any>;
}

export interface IdentityData {
  name: string;
  ownerId: string | null;
  guildId: string | null;
}

export interface EconomyData {
  metal: number;
  energy: number;
  credits: number;
  production: {
    metal: number;
    energy: number;
    credits: number;
    [key: string]: number;
  };
  [key: string]: any;
}

export interface StorageData {
  capacity: number;
  resources: Record<string, number>;
}

export interface ProductionChainData {
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  duration: number;
  progress: number;
  status: 'idle' | 'producing' | 'stalled_input' | 'stalled_output';
  autoRepeat: boolean;
  efficiency: number;
  lastTickProduction: number;
}

export interface BuildingData {
  type: BuildingType;
  level: number;
  active: boolean;
  constructionProgress: number;
}

export interface ShipData {
  type: UnitType;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  modules: any[];
}

export interface FleetData {
  name: string;
  ships: number[];
  members: number[];
  state: 'idle' | 'moving' | 'combat' | 'mining';
  destination: { x: number; y: number; z: number } | null;
  formation: 'circle' | 'line' | 'delta';
  isJumping: boolean;
  jumpProgress: number;
}

export interface PlanetData {
  type: string;
  radius: number;
  resources: Record<string, number>;
}

export interface StarSystemData {
  name: string;
  coordinates: { x: number; y: number; z: number };
  planets: number[];
}

export interface LogisticsData {
  transfers: Array<{
    resource: string;
    amount: number;
    remainingTime: number;
    targetEntityId: number;
  }>;
}

export interface SelectableData {
  type: string;
  isSelected: boolean;
}

export interface CombatData {
  hp: number;
  maxHp: number;
  firepower: number;
  targetId: number | null;
  lastFireTime: number;
  fireRate: number;
}

export interface ShieldWedgeData {
  strength: number;
  maxStrength: number;
  angle: number;
  direction: number;
}

export interface RoadData {
  connectedTo: number[];
}

export interface CargoData {
  capacity: number;
  inventory: {
    metal: number;
    energy: number;
    credits: number;
  };
  originId: number | null;
  targetId: number | null;
  status: 'idle' | 'loading' | 'traveling' | 'unloading';
}

export interface SpecializationData {
  type: string;
  bonuses: Record<string, number>;
}

export interface SovereigntyData {
  ownerId: string | null;
  influence: number;
  taxRate: number;
  contested: boolean;
  claimants: Record<string, number>;
}

export interface CorporationData {
  name: string;
  color: string;
  members: string[];
  assets: number[];
  treasury: number;
  reputation: Record<string, number>;
}

export interface PlayerData {
  username: string;
  email: string;
  passwordHash: string;
  level: number;
  xp: number;
  lastLogin: number;
  isOnline: boolean;
}
