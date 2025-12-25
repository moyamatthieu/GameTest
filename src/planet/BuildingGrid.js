import * as THREE from 'three';

/**
 * BuildingGrid - Grille de construction adaptative sur terrain procédural
 *
 * Gère une grille virtuelle qui s'adapte à la surface de la planète,
 * permettant le snapping et la validation de placement.
 */
export class BuildingGrid {
  constructor(planetGenerator, options = {}) {
    this.planetGenerator = planetGenerator;
    this.cellSize = options.cellSize || 5; // Taille d'une cellule en unités monde
    this.maxSlope = options.maxSlope || 25; // Pente max pour construire (degrés)

    // Grille de cellules occupées (coordonnées sphériques arrondies)
    this.occupiedCells = new Map(); // "theta,phi" -> entityId

    // Grille visible pour le debug
    this.gridMesh = null;
    this.gridVisible = false;
  }

  /**
   * Convertit une position monde en coordonnées de grille
   */
  worldToGrid(position) {
    // Normaliser la position pour obtenir les coordonnées sphériques
    const normalized = position.clone().normalize();
    const spherical = this.planetGenerator.cartesianToSpherical(
      normalized.x,
      normalized.y,
      normalized.z
    );

    // Arrondir aux cellules de grille
    const gridTheta = this.roundToGrid(spherical.theta);
    const gridPhi = this.roundToGrid(spherical.phi);

    return { theta: gridTheta, phi: gridPhi };
  }

  /**
   * Convertit des coordonnées de grille en position monde
   */
  gridToWorld(theta, phi) {
    // Obtenir la hauteur du terrain à cette position
    const basePos = this.planetGenerator.sphericalToCartesian(1, theta, phi);
    const baseVec = new THREE.Vector3(basePos.x, basePos.y, basePos.z);
    const height = this.planetGenerator.getTerrainHeight(baseVec.x, baseVec.y, baseVec.z);

    const radius = this.planetGenerator.radius + height;
    const worldPos = this.planetGenerator.sphericalToCartesian(radius, theta, phi);

    return new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
  }

  /**
   * Arrondit un angle aux cellules de grille
   */
  roundToGrid(angle) {
    // Convertir l'angle en distance sur la surface
    const arcLength = angle * this.planetGenerator.radius;

    // Arrondir à la taille de cellule
    const snapped = Math.round(arcLength / this.cellSize) * this.cellSize;

    // Reconvertir en angle
    return snapped / this.planetGenerator.radius;
  }

  /**
   * Obtient la clé unique pour une cellule de grille
   */
  getCellKey(theta, phi) {
    // Arrondir à 6 décimales pour éviter les problèmes de floating point
    const t = Math.round(theta * 1000000) / 1000000;
    const p = Math.round(phi * 1000000) / 1000000;
    return `${t},${p}`;
  }

  /**
   * Vérifie si une cellule est occupée
   */
  isCellOccupied(theta, phi) {
    const key = this.getCellKey(theta, phi);
    return this.occupiedCells.has(key);
  }

  /**
   * Occupe une cellule avec une entité
   */
  occupyCell(theta, phi, entityId) {
    const key = this.getCellKey(theta, phi);
    this.occupiedCells.set(key, entityId);
  }

  /**
   * Libère une cellule
   */
  freeCell(theta, phi) {
    const key = this.getCellKey(theta, phi);
    this.occupiedCells.delete(key);
  }

  /**
   * Obtient l'entité occupant une cellule
   */
  getCellOccupant(theta, phi) {
    const key = this.getCellKey(theta, phi);
    return this.occupiedCells.get(key);
  }

  /**
   * Obtient les cellules voisines (8 directions)
   */
  getNeighborCells(theta, phi) {
    const neighbors = [];
    const deltaTheta = this.cellSize / this.planetGenerator.radius;
    const deltaPhi = this.cellSize / this.planetGenerator.radius;

    for (let dTheta = -1; dTheta <= 1; dTheta++) {
      for (let dPhi = -1; dPhi <= 1; dPhi++) {
        if (dTheta === 0 && dPhi === 0) continue;

        const neighborTheta = theta + dTheta * deltaTheta;
        const neighborPhi = phi + dPhi * deltaPhi;

        // Vérifier les limites (phi entre 0 et PI)
        if (neighborPhi >= 0 && neighborPhi <= Math.PI) {
          neighbors.push({ theta: neighborTheta, phi: neighborPhi });
        }
      }
    }

    return neighbors;
  }

  /**
   * Vérifie si un bâtiment peut être placé (incluant voisinage)
   */
  canPlaceBuilding(theta, phi, buildingSize = 1) {
    // Vérifier la cellule principale
    if (this.isCellOccupied(theta, phi)) {
      return false;
    }

    // Pour les bâtiments plus grands, vérifier les cellules adjacentes
    if (buildingSize > 1) {
      const neighbors = this.getNeighborCells(theta, phi);
      for (const neighbor of neighbors) {
        if (this.isCellOccupied(neighbor.theta, neighbor.phi)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Crée un mesh visuel de la grille (debug)
   */
  createVisualGrid(scene) {
    if (this.gridMesh) {
      scene.remove(this.gridMesh);
      this.gridMesh.geometry.dispose();
      this.gridMesh.material.dispose();
    }

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const thetaSteps = Math.ceil((2 * Math.PI * this.planetGenerator.radius) / this.cellSize);
    const phiSteps = Math.ceil((Math.PI * this.planetGenerator.radius) / this.cellSize);

    // Créer les lignes de la grille
    for (let i = 0; i <= thetaSteps; i++) {
      const theta = (i / thetaSteps) * 2 * Math.PI - Math.PI;

      for (let j = 0; j <= phiSteps; j++) {
        const phi = (j / phiSteps) * Math.PI;

        const pos = this.gridToWorld(theta, phi);
        const isOccupied = this.isCellOccupied(theta, phi);

        // Couleur : vert si libre, rouge si occupé
        const color = isOccupied ? new THREE.Color(0xff0000) : new THREE.Color(0x00ff00);

        positions.push(pos.x, pos.y, pos.z);
        colors.push(color.r, color.g, color.b);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.5
    });

    this.gridMesh = new THREE.Points(geometry, material);
    scene.add(this.gridMesh);
    this.gridVisible = true;
  }

  /**
   * Active/désactive la visibilité de la grille
   */
  toggleGridVisibility() {
    if (this.gridMesh) {
      this.gridMesh.visible = !this.gridMesh.visible;
      this.gridVisible = this.gridMesh.visible;
    }
  }

  /**
   * Met à jour la grille visuelle (après placement/destruction)
   */
  updateVisualGrid(scene) {
    if (this.gridVisible && this.gridMesh) {
      this.createVisualGrid(scene);
    }
  }

  /**
   * Nettoie les ressources
   */
  dispose() {
    if (this.gridMesh) {
      this.gridMesh.geometry.dispose();
      this.gridMesh.material.dispose();
    }
  }

  /**
   * Obtient les statistiques de la grille
   */
  getStats() {
    return {
      cellSize: this.cellSize,
      occupiedCells: this.occupiedCells.size,
      maxSlope: this.maxSlope,
      gridVisible: this.gridVisible
    };
  }
}
