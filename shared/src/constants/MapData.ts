export interface Obstacle {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: number;
}

export const MAP_OBSTACLES: Obstacle[] = [
  { x: 5, y: 1, z: 5, w: 2, h: 2, d: 2, color: 0x884444 },
  { x: -10, y: 1, z: -10, w: 4, h: 2, d: 4, color: 0x448844 },
  { x: 15, y: 1, z: -5, w: 2, h: 5, d: 2, color: 0x444488 },
  { x: -5, y: 0.5, z: 15, w: 10, h: 1, d: 2, color: 0x888844 },
];
