import { Component } from '../World';
import { PlanetData } from '../../core/world/types';

export class PlanetComponent implements Component {
  constructor(
    public data: PlanetData,
    public heightmapData?: Float32Array
  ) {}
}
