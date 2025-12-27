import seedrandom from 'seedrandom';

/**
 * Deterministic PRNG wrapper using the Alea algorithm.
 */
export class Random {
  private rng: seedrandom.PRNG;

  constructor(seed: string) {
    this.rng = seedrandom(seed, { alea: true });
  }

  /**
   * Returns a random float between 0 and 1.
   */
  next(): number {
    return this.rng();
  }

  /**
   * Returns a random integer between min (inclusive) and max (exclusive).
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.rng() * (max - min)) + min;
  }

  /**
   * Returns a random float between min and max.
   */
  nextFloat(min: number, max: number): number {
    return this.rng() * (max - min) + min;
  }

  /**
   * Returns a random element from an array.
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  /**
   * Returns true with a given probability (0 to 1).
   */
  chance(probability: number): boolean {
    return this.rng() < probability;
  }
}
