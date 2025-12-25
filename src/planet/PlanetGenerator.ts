import * as THREE from 'three';
import { createNoise3D, NoiseFunction3D } from 'simplex-noise';
import { IPlanetGenerator } from './BuildingGrid';

interface VertexData {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  height: number;
  sphericalCoords: { r: number; theta: number; phi: number };
}

interface FaceData {
  vertices: THREE.Vector3[];
  normals: THREE.Vector3[];
  faceNormal: THREE.Vector3;
  center: THREE.Vector3;
  indices: number[];
}

export class PlanetGenerator implements IPlanetGenerator {
  public radius: number;
  private segments: number;
  private seed: number;
  private heightScale: number;
  private octaves: number;
  private persistence: number;
  private lacunarity: number;
  private seaLevel: number;
  private mountainThreshold: number;
  private noise3D: NoiseFunction3D;
  private vertexData: Map<number, VertexData>;
  private faceData: FaceData[];

  constructor(options: any = {}) {
    this.radius = options.radius || 100;
    this.segments = options.segments || 128;
    this.seed = options.seed || Math.random();
    this.heightScale = options.heightScale || 15;
    this.octaves = options.octaves || 4;
    this.persistence = options.persistence || 0.5;
    this.lacunarity = options.lacunarity || 2.0;
    this.seaLevel = options.seaLevel || -5;
    this.mountainThreshold = options.mountainThreshold || 8;

    this.noise3D = createNoise3D(() => this.seed);
    this.vertexData = new Map();
    this.faceData = [];
  }

  generate(): THREE.BufferGeometry {
    const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const length = Math.sqrt(x * x + y * y + z * z);
      const nx = x / length;
      const ny = y / length;
      const nz = z / length;

      const height = this.getTerrainHeight(nx, ny, nz);
      const newRadius = this.radius + height;
      positions.setXYZ(i, nx * newRadius, ny * newRadius, nz * newRadius);

      this.vertexData.set(i, {
        position: new THREE.Vector3(nx * newRadius, ny * newRadius, nz * newRadius),
        normal: new THREE.Vector3(nx, ny, nz),
        height: height,
        sphericalCoords: this.cartesianToSpherical(nx, ny, nz)
      });
    }

    geometry.computeVertexNormals();
    const normals = geometry.attributes.normal;

    for (let i = 0; i < normals.count; i++) {
      const data = this.vertexData.get(i);
      if (data) {
        data.normal.set(normals.getX(i), normals.getY(i), normals.getZ(i));
      }
    }

    this.buildFaceData(geometry);
    return geometry;
  }

  getTerrainHeight(nx: number, ny: number, nz: number): number {
    let height = 0;
    let amplitude = this.heightScale;
    let frequency = 1.0;

    for (let octave = 0; octave < this.octaves; octave++) {
      const noiseValue = this.noise3D(nx * frequency, ny * frequency, nz * frequency);
      height += noiseValue * amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return height;
  }

  private buildFaceData(geometry: THREE.BufferGeometry): void {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const index = geometry.index!;

    this.faceData = [];

    for (let i = 0; i < index.count; i += 3) {
      const i1 = index.getX(i);
      const i2 = index.getX(i + 1);
      const i3 = index.getX(i + 2);

      const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1));
      const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2));
      const v3 = new THREE.Vector3(positions.getX(i3), positions.getY(i3), positions.getZ(i3));

      const n1 = new THREE.Vector3(normals.getX(i1), normals.getY(i1), normals.getZ(i1));
      const n2 = new THREE.Vector3(normals.getX(i2), normals.getY(i2), normals.getZ(i2));
      const n3 = new THREE.Vector3(normals.getX(i3), normals.getY(i3), normals.getZ(i3));

      const faceNormal = new THREE.Vector3().add(n1).add(n2).add(n3).divideScalar(3).normalize();
      const center = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);

      this.faceData.push({
        vertices: [v1, v2, v3],
        normals: [n1, n2, n3],
        faceNormal,
        center,
        indices: [i1, i2, i3]
      });
    }
  }

  cartesianToSpherical(x: number, y: number, z: number): { r: number; theta: number; phi: number } {
    const r = Math.sqrt(x * x + y * y + z * z);
    const theta = Math.atan2(z, x);
    const phi = Math.acos(y / r);
    return { r, theta, phi };
  }

  sphericalToCartesian(r: number, theta: number, phi: number): { x: number; y: number; z: number } {
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta)
    };
  }

  getTerrainDataAt(point: THREE.Vector3): any {
    let closestFace: FaceData | null = null;
    let minDistance = Infinity;

    for (const face of this.faceData) {
      const distance = point.distanceTo(face.center);
      if (distance < minDistance) {
        minDistance = distance;
        closestFace = face;
      }
    }

    if (!closestFace) return null;

    return {
      normal: closestFace.faceNormal.clone(),
      height: minDistance,
      slope: this.calculateSlope(closestFace.faceNormal)
    };
  }

  calculateSlope(normal: THREE.Vector3): number {
    const up = normal.clone().normalize();
    return Math.acos(up.y) * (180 / Math.PI);
  }

  getBiome(height: number, slope: number): string {
    if (height < this.seaLevel) return 'ocean';
    if (height > this.mountainThreshold) return 'mountain';
    if (slope > 30) return 'cliff';
    if (slope < 5) return 'plain';
    return 'hill';
  }

  createMaterial(): THREE.Material {
    return new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8, metalness: 0.2 });
  }
}
