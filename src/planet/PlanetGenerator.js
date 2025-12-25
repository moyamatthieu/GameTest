import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

/**
 * PlanetGenerator - Génération procédurale de terrain planétaire
 *
 * Crée une planète sphérique avec relief réaliste (montagnes, vallées, plaines)
 * en utilisant du bruit de Perlin/Simplex sur plusieurs octaves.
 */
export class PlanetGenerator {
  constructor(options = {}) {
    this.radius = options.radius || 100;
    this.segments = options.segments || 128; // Résolution du mesh
    this.seed = options.seed || Math.random();

    // Paramètres de génération de terrain
    this.heightScale = options.heightScale || 15; // Amplitude max du relief
    this.octaves = options.octaves || 4; // Nombre de couches de bruit
    this.persistence = options.persistence || 0.5; // Atténuation par octave
    this.lacunarity = options.lacunarity || 2.0; // Fréquence par octave

    // Paramètres de biomes
    this.seaLevel = options.seaLevel || -5; // Niveau de la mer
    this.mountainThreshold = options.mountainThreshold || 8; // Seuil montagne

    // Initialiser le générateur de bruit
    this.noise3D = createNoise3D(() => this.seed);

    // Cache pour les données de terrain
    this.vertexData = new Map(); // vertex index -> {position, normal, height}
    this.faceData = []; // triangles avec normales
  }

  /**
   * Génère la géométrie de la planète avec relief
   */
  generate() {
    const geometry = new THREE.SphereGeometry(
      this.radius,
      this.segments,
      this.segments
    );

    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;

    // Appliquer le bruit pour créer le relief
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Normaliser pour obtenir la position sur la sphère unitaire
      const length = Math.sqrt(x * x + y * y + z * z);
      const nx = x / length;
      const ny = y / length;
      const nz = z / length;

      // Calculer la hauteur avec bruit multi-octave
      const height = this.getTerrainHeight(nx, ny, nz);

      // Appliquer le déplacement
      const newRadius = this.radius + height;
      positions.setXYZ(i, nx * newRadius, ny * newRadius, nz * newRadius);

      // Stocker les données du vertex
      this.vertexData.set(i, {
        position: new THREE.Vector3(nx * newRadius, ny * newRadius, nz * newRadius),
        normal: new THREE.Vector3(nx, ny, nz),
        height: height,
        sphericalCoords: this.cartesianToSpherical(nx, ny, nz)
      });
    }

    // Recalculer les normales pour un éclairage correct
    geometry.computeVertexNormals();

    // Stocker les normales mises à jour
    for (let i = 0; i < normals.count; i++) {
      const data = this.vertexData.get(i);
      if (data) {
        data.normal.set(normals.getX(i), normals.getY(i), normals.getZ(i));
      }
    }

    // Créer les données de faces pour le raycasting précis
    this.buildFaceData(geometry);

    return geometry;
  }

  /**
   * Calcule la hauteur du terrain avec bruit multi-octave (Fractional Brownian Motion)
   */
  getTerrainHeight(nx, ny, nz) {
    let height = 0;
    let amplitude = this.heightScale;
    let frequency = 1.0;

    for (let octave = 0; octave < this.octaves; octave++) {
      // Échantillonner le bruit 3D
      const noiseValue = this.noise3D(
        nx * frequency,
        ny * frequency,
        nz * frequency
      );

      height += noiseValue * amplitude;

      // Réduire l'amplitude et augmenter la fréquence
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return height;
  }

  /**
   * Construit les données de faces pour un raycasting précis
   */
  buildFaceData(geometry) {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const index = geometry.index;

    this.faceData = [];

    for (let i = 0; i < index.count; i += 3) {
      const i1 = index.getX(i);
      const i2 = index.getX(i + 1);
      const i3 = index.getX(i + 2);

      const v1 = new THREE.Vector3(
        positions.getX(i1),
        positions.getY(i1),
        positions.getZ(i1)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i2),
        positions.getY(i2),
        positions.getZ(i2)
      );
      const v3 = new THREE.Vector3(
        positions.getX(i3),
        positions.getY(i3),
        positions.getZ(i3)
      );

      const n1 = new THREE.Vector3(normals.getX(i1), normals.getY(i1), normals.getZ(i1));
      const n2 = new THREE.Vector3(normals.getX(i2), normals.getY(i2), normals.getZ(i2));
      const n3 = new THREE.Vector3(normals.getX(i3), normals.getY(i3), normals.getZ(i3));

      // Normale moyenne de la face
      const faceNormal = new THREE.Vector3()
        .add(n1)
        .add(n2)
        .add(n3)
        .divideScalar(3)
        .normalize();

      // Centre de la face
      const center = new THREE.Vector3()
        .add(v1)
        .add(v2)
        .add(v3)
        .divideScalar(3);

      this.faceData.push({
        vertices: [v1, v2, v3],
        normals: [n1, n2, n3],
        faceNormal,
        center,
        indices: [i1, i2, i3]
      });
    }
  }

  /**
   * Convertit des coordonnées cartésiennes en sphériques
   */
  cartesianToSpherical(x, y, z) {
    const r = Math.sqrt(x * x + y * y + z * z);
    const theta = Math.atan2(z, x); // Longitude
    const phi = Math.acos(y / r); // Latitude

    return { r, theta, phi };
  }

  /**
   * Convertit des coordonnées sphériques en cartésiennes
   */
  sphericalToCartesian(r, theta, phi) {
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta)
    };
  }

  /**
   * Obtient les données de terrain à une position donnée (interpolation)
   */
  getTerrainDataAt(point) {
    // Trouver le triangle le plus proche
    let closestFace = null;
    let minDistance = Infinity;

    for (const face of this.faceData) {
      const distance = point.distanceTo(face.center);
      if (distance < minDistance) {
        minDistance = distance;
        closestFace = face;
      }
    }

    if (!closestFace) {
      return null;
    }

    // Interpoler les données
    return {
      normal: closestFace.faceNormal.clone(),
      height: minDistance,
      slope: this.calculateSlope(closestFace.faceNormal)
    };
  }

  /**
   * Calcule la pente d'une surface (en degrés)
   */
  calculateSlope(normal) {
    // La pente est l'angle entre la normale et la verticale (radiale)
    const up = normal.clone().normalize();
    const angle = Math.acos(up.y) * (180 / Math.PI);
    return angle;
  }

  /**
   * Détermine le biome à une position donnée
   */
  getBiome(height, slope) {
    if (height < this.seaLevel) {
      return 'ocean';
    } else if (height > this.mountainThreshold) {
      return 'mountain';
    } else if (slope > 30) {
      return 'cliff';
    } else if (slope < 5) {
      return 'plain';
    } else {
      return 'hill';
    }
  }

  /**
   * Crée un matériau avec texture basée sur le biome
   */
  createMaterial() {
    // Utiliser un shader personnalisé pour afficher les biomes
    const material = new THREE.MeshStandardMaterial({
      vertexColors: false,
      flatShading: false,
      roughness: 0.8,
      metalness: 0.2
    });

    // Pour l'instant, couleur de base
    // TODO: Ajouter un shader avec texture procédurale par biome
    material.color.setHex(0x2e7d32); // Vert de base

    return material;
  }

  /**
   * Génère les données de debug (wireframe des biomes)
   */
  generateDebugOverlay() {
    const colors = {
      ocean: 0x1976d2,
      plain: 0x66bb6a,
      hill: 0x8d6e63,
      mountain: 0x9e9e9e,
      cliff: 0x5d4037
    };

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colorArray = [];

    for (const [index, data] of this.vertexData.entries()) {
      const biome = this.getBiome(data.height, this.calculateSlope(data.normal));
      const color = new THREE.Color(colors[biome] || 0xffffff);

      positions.push(data.position.x, data.position.y, data.position.z);
      colorArray.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true
    });

    return new THREE.Points(geometry, material);
  }
}
