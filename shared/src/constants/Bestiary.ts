export enum EnemyType {
  SPRIGGAN = 'Spriggan',
  SPECTRAL_KNIGHT = 'Spectral Knight',
  LAND_DRAKE = 'Land Drake',
}

export interface EnemyStats {
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  fleeThreshold?: number; // HP percentage to start fleeing
}

export const BESTIARY: Record<EnemyType, EnemyStats> = {
  [EnemyType.SPRIGGAN]: {
    maxHealth: 80,
    damage: 12,
    attackSpeed: 1.5,
    moveSpeed: 4.5,
    aggroRange: 12,
    attackRange: 2,
    fleeThreshold: 0.2,
  },
  [EnemyType.SPECTRAL_KNIGHT]: {
    maxHealth: 200,
    damage: 25,
    attackSpeed: 0.8,
    moveSpeed: 2.5,
    aggroRange: 8,
    attackRange: 3,
  },
  [EnemyType.LAND_DRAKE]: {
    maxHealth: 150,
    damage: 18,
    attackSpeed: 1.0,
    moveSpeed: 5.0,
    aggroRange: 15,
    attackRange: 10, // Ranged attack
    fleeThreshold: 0.1,
  },
};
