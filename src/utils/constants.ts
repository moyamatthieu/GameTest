export const Constants = {
  GROUND_SIZE: 100,
  GRID_DIVISIONS: 100,
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_MIN_DISTANCE: 2,
  CAMERA_MAX_DISTANCE: 50,

  COLORS: {
    SKY: 0x87ceeb,
    GROUND: 0x228b22,
    AMBIENT_LIGHT: 0x404040,
    DIRECTIONAL_LIGHT: 0xffffff,
  },

  SCENES: {
    PLANET: 'planet',
    SYSTEM: 'system',
    GALAXY: 'galaxy',
  },

  NAV_IDS: {
    PLANET: 'nav-planet',
    SYSTEM: 'nav-system',
    GALAXY: 'nav-galaxy',
  },
} as const;

export type SceneName = typeof Constants.SCENES[keyof typeof Constants.SCENES];
