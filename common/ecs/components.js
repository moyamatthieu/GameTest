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
};

export const Position = (x = 0, y = 0, z = 0, referenceFrame = 'global') => ({
  x,
  y,
  z,
  referenceFrame,
});
export const Rotation = (x = 0, y = 0, z = 0) => ({ x, y, z });
export const Velocity = (vx = 0, vy = 0, vz = 0) => ({ vx, vy, vz });

export const Renderable = (type, color = 0xffffff, options = {}) => ({
  type, // 'building', 'ship', 'planet', 'star', etc.
  color,
  ...options
});

export const ConstructionContext = (mode, parentId = null) => ({
  mode, // 'PLANET' | 'SPACE'
  parentId, // ID de la planète ou de la station parente
  snappingData: {}, // Stockage des angles theta/phi pour les planètes
});

export const Identity = (name = 'Unknown', ownerId = null, guildId = null) => ({
  name,
  ownerId,
  guildId,
});

export const Economy = (metal = 0, energy = 0, credits = 0) => ({
  metal,
  energy,
  credits,
  production: {
    metal: 0,
    energy: 0,
    credits: 0,
  },
});

export const Storage = (capacity = 1000) => ({
  capacity,
  resources: {}, // { metal: 100, gas: 50 }
});

export const ProductionChain = (inputs = {}, outputs = {}, duration = 1000) => ({
  inputs, // { metal: 1 }
  outputs, // { hull: 1 }
  duration, // ms
  progress: 0,
  status: 'idle', // 'idle', 'producing', 'stalled_input', 'stalled_output'
  autoRepeat: true,
  efficiency: 1.0,
  lastTickProduction: 0,
});

export const Building = (type, level = 1) => ({
  type, // 'base', 'habitation', 'ferme', 'usine', 'entrepot', 'centrale', 'mine', 'labo'
  level,
  active: true,
  constructionProgress: 100, // 100 = finished
});

export const Ship = (type = 'fighter', hull = 100, shield = 0) => ({
  type, // 'construction', 'fighter', 'cruiser', 'transport'
  hull,
  maxHull: hull,
  shield,
  maxShield: shield,
  modules: [],
});

export const Fleet = (name = 'Nouvelle Flotte') => ({
  name,
  ships: [], // List of entity IDs
  members: [], // Alias for ships for compatibility
  state: 'idle', // 'idle', 'moving', 'combat', 'mining'
  destination: null,
  formation: 'circle', // 'circle', 'line', 'delta'
  isJumping: false,
  jumpProgress: 0,
});

export const Planet = (type = 'terran', radius = 100) => ({
  type,
  radius,
  resources: {}, // Abundance of resources
});

export const StarSystem = (name, coordinates) => ({
  name,
  coordinates, // { x, y, z } in galaxy
  planets: [], // List of planet entity IDs
});

export const Logistics = () => ({
  transfers: [], // { resource, amount, remainingTime, targetEntityId }
});

export const Selectable = (type = 'generic') => ({
  type,
  isSelected: false,
});

export const Combat = (hp = 100, maxHp = 100, firepower = 10) => ({
  hp,
  maxHp,
  firepower,
  targetId: null,
  lastFireTime: 0,
  fireRate: 1000, // ms
});

export const ShieldWedge = (strength = 50, maxStrength = 50, angle = Math.PI / 2) => ({
  strength,
  maxStrength,
  angle, // Largeur du wedge en radians (ex: PI/2 = 90 degrés)
  direction: 0, // Angle central du wedge par rapport à l'avant du vaisseau
});

export const Road = () => ({
  connectedTo: [], // List of entity IDs
});

export const Cargo = (capacity = 100) => ({
  capacity,
  inventory: {
    metal: 0,
    energy: 0,
    credits: 0,
  },
  originId: null,
  targetId: null,
  status: 'idle', // 'idle', 'loading', 'traveling', 'unloading'
});

export const Specialization = (type = 'terrestre') => ({
  type, // 'volcanique', 'gazeuse', 'terrestre'
  bonuses: {
    metal: type === 'volcanique' ? 1.5 : 1.0,
    energy: type === 'gazeuse' ? 1.5 : 1.0,
    credits: type === 'terrestre' ? 1.2 : 1.0,
  },
});

export const Sovereignty = (ownerId = null, influence = 0, taxRate = 0.05) => ({
  ownerId, // ID de la corporation ou du joueur
  influence, // Rayon ou force de l'influence
  taxRate, // Pourcentage prélevé sur les transactions/passages
  contested: false,
  claimants: {}, // { corporationId: influenceValue }
});

export const Corporation = (name = 'New Corp', color = '#ffffff') => ({
  name,
  color,
  members: [], // IDs des joueurs
  assets: [], // IDs des entités possédées (systèmes, stations)
  treasury: 0,
  reputation: {}, // { otherCorpId: value }
});

export const Player = (username, email = '', passwordHash = '') => ({
  username,
  email,
  passwordHash,
  level: 1,
  xp: 0,
  lastLogin: Date.now(),
  isOnline: true,
});
