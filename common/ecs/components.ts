import {
  PositionData, RotationData, VelocityData, RenderableData,
  ConstructionContextData, IdentityData, EconomyData, StorageData,
  ProductionChainData, BuildingData, ShipData, FleetData,
  PlanetData, StarSystemData, LogisticsData, SelectableData,
  CombatData, ShieldWedgeData, RoadData, CargoData,
  SpecializationData, SovereigntyData, CorporationData, PlayerData
} from '../types/components';
import { UnitType, BuildingType } from '../types/game';

export const ComponentTypes = {
  Position: 1 << 0,
  Rotation: 1 << 1,
  Velocity: 1 << 2,
  Identity: 1 << 3,
  Economy: 1 << 4,
  Storage: 1 << 5,
  ProductionChain: 1 << 6,
  Building: 1 << 7,
  Ship: 1 << 8,
  Fleet: 1 << 9,
  Planet: 1 << 10,
  StarSystem: 1 << 11,
  Logistics: 1 << 12,
  Selectable: 1 << 13,
  Combat: 1 << 14,
  ShieldWedge: 1 << 15,
  Road: 1 << 16,
  Cargo: 1 << 17,
  Specialization: 1 << 18,
  Sovereignty: 1 << 19,
  Corporation: 1 << 20,
  ConstructionContext: 1 << 21,
  Renderable: 1 << 22,
  Player: 1 << 23,
} as const;

export type ComponentName = keyof typeof ComponentTypes;

export const Position = (x = 0, y = 0, z = 0, referenceFrame = 'global'): PositionData => ({
  x,
  y,
  z,
  referenceFrame,
});

export const Rotation = (x = 0, y = 0, z = 0): RotationData => ({ x, y, z });

export const Velocity = (vx = 0, vy = 0, vz = 0): VelocityData => ({ vx, vy, vz });

export const Renderable = (type: string, color = 0xffffff, options = {}): RenderableData => ({
  type,
  color,
  ...options
});

export const ConstructionContext = (mode: 'PLANET' | 'SPACE', parentId: number | null = null): ConstructionContextData => ({
  mode,
  parentId,
  snappingData: {},
});

export const Identity = (name = 'Unknown', ownerId: string | null = null, guildId: string | null = null): IdentityData => ({
  name,
  ownerId,
  guildId,
});

export const Economy = (metal = 0, energy = 0, credits = 0): EconomyData => ({
  metal,
  energy,
  credits,
  production: {
    metal: 0,
    energy: 0,
    credits: 0,
  },
});

export const Storage = (capacity = 1000): StorageData => ({
  capacity,
  resources: {},
});

export const ProductionChain = (inputs = {}, outputs = {}, duration = 1000): ProductionChainData => ({
  inputs,
  outputs,
  duration,
  progress: 0,
  status: 'idle',
  autoRepeat: true,
  efficiency: 1.0,
  lastTickProduction: 0,
});

export const Building = (type: BuildingType, level = 1): BuildingData => ({
  type,
  level,
  active: true,
  constructionProgress: 100,
});

export const Ship = (type: UnitType = UnitType.FIGHTER, hull = 100, shield = 0): ShipData => ({
  type,
  hull,
  maxHull: hull,
  shield,
  maxShield: shield,
  modules: [],
});

export const Fleet = (name = 'Nouvelle Flotte'): FleetData => ({
  name,
  ships: [],
  members: [],
  state: 'idle',
  destination: null,
  formation: 'circle',
  isJumping: false,
  jumpProgress: 0,
});

export const Planet = (type = 'terran', radius = 100): PlanetData => ({
  type,
  radius,
  resources: {},
});

export const StarSystem = (name: string, coordinates: { x: number; y: number; z: number }): StarSystemData => ({
  name,
  coordinates,
  planets: [],
});

export const Logistics = (): LogisticsData => ({
  transfers: [],
});

export const Selectable = (type = 'generic'): SelectableData => ({
  type,
  isSelected: false,
});

export const Combat = (hp = 100, maxHp = 100, firepower = 10): CombatData => ({
  hp,
  maxHp,
  firepower,
  targetId: null,
  lastFireTime: 0,
  fireRate: 1000,
});

export const ShieldWedge = (strength = 50, maxStrength = 50, angle = Math.PI / 2): ShieldWedgeData => ({
  strength,
  maxStrength,
  angle,
  direction: 0,
});

export const Road = (): RoadData => ({
  connectedTo: [],
});

export const Cargo = (capacity = 100): CargoData => ({
  capacity,
  inventory: {
    metal: 0,
    energy: 0,
    credits: 0,
  },
  originId: null,
  targetId: null,
  status: 'idle',
});

export const Specialization = (type = 'terrestre'): SpecializationData => ({
  type,
  bonuses: {
    metal: type === 'volcanique' ? 1.5 : 1.0,
    energy: type === 'gazeuse' ? 1.5 : 1.0,
    credits: type === 'terrestre' ? 1.2 : 1.0,
  },
});

export const Sovereignty = (ownerId: string | null = null, influence = 0, taxRate = 0.05): SovereigntyData => ({
  ownerId,
  influence,
  taxRate,
  contested: false,
  claimants: {},
});

export const Corporation = (name = 'New Corp', color = '#ffffff'): CorporationData => ({
  name,
  color,
  members: [],
  assets: [],
  treasury: 0,
  reputation: {},
});

export const Player = (username: string, email = '', passwordHash = ''): PlayerData => ({
  username,
  email,
  passwordHash,
  level: 1,
  xp: 0,
  lastLogin: Date.now(),
  isOnline: true,
});
