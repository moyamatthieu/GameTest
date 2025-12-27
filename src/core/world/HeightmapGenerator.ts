import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';

export class HeightmapGenerator {
  /**
   * Generates a heightmap for a planet surface.
   * Uses Fractal Brownian Motion (fBm) with Simplex Noise.
   */
  public generate(seed: string, resolution: number = 128): Float32Array {
    const rng = seedrandom(seed);
    const noise2D = createNoise2D(rng);
    const data = new Float32Array(resolution * resolution);

    const octaves = 6;
    const persistence = 0.5;
    const lacunarity = 2.0;

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        let amplitude = 1.0;
        let frequency = 1.0;
        let noiseHeight = 0;

        for (let i = 0; i < octaves; i++) {
          const sampleX = (x / resolution) * frequency;
          const sampleY = (y / resolution) * frequency;
          const simplexValue = noise2D(sampleX, sampleY);
          noiseHeight += simplexValue * amplitude;

          amplitude *= persistence;
          frequency *= lacunarity;
        }

        data[y * resolution + x] = noiseHeight;
      }
    }

    return data;
  }
}
