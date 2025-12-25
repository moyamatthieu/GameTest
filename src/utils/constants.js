export class Constants {
  static GROUND_SIZE = 100
  static GRID_DIVISIONS = 100
  static CAMERA_FOV = 75
  static CAMERA_NEAR = 0.1
  static CAMERA_FAR = 1000
  static CAMERA_MIN_DISTANCE = 2
  static CAMERA_MAX_DISTANCE = 50

  static COLORS = {
    SKY: 0x87ceeb,
    GROUND: 0x228b22,
    AMBIENT_LIGHT: 0x404040,
    DIRECTIONAL_LIGHT: 0xffffff,
  }

  // Enums pour les scènes du jeu
  static SCENES = {
    PLANET: 'planet',
    SYSTEM: 'system',
    GALAXY: 'galaxy',
  }

  // IDs des éléments DOM pour la navigation
  static NAV_IDS = {
    PLANET: 'nav-planet',
    SYSTEM: 'nav-system',
    GALAXY: 'nav-galaxy',
  }
}
