# Système de Construction sur Planète Procédurale

## 📋 Vue d'ensemble

Le système de construction sur planète procédurale est une architecture complète et intelligente permettant de placer des bâtiments sur une planète générée avec relief (montagnes, vallées, plaines).

## 🏗️ Architecture

```
src/planet/
├── PlanetGenerator.js      → Génération procédurale de terrain
├── BuildingGrid.js          → Grille de construction adaptative
└── PlacementValidator.js    → Validation intelligente de placement

src/input/
└── BuildingPlacer.js        → Gestionnaire d'input utilisateur

src/scenes/
└── PlanetScene.js           → Scène planétaire (initialise les systèmes)
```

## 🌍 PlanetGenerator

**Responsabilités** :
- Génération procédurale de terrain sphérique avec bruit de Perlin/Simplex
- Calcul de hauteur, normale, pente pour chaque point
- Détection de biomes (océan, plaine, colline, montagne, falaise)
- Support multi-octave (Fractional Brownian Motion)

**Paramètres configurables** :
```javascript
{
  radius: 100,           // Rayon de la planète
  segments: 128,         // Résolution du mesh
  heightScale: 15,       // Amplitude max du relief
  octaves: 4,            // Nombre de couches de bruit
  persistence: 0.5,      // Atténuation par octave
  lacunarity: 2.0,       // Fréquence par octave
  seaLevel: -5,          // Niveau de la mer
  mountainThreshold: 8   // Seuil montagne
}
```

**Méthodes principales** :
- `generate()` : Génère la géométrie avec relief
- `getTerrainHeight(nx, ny, nz)` : Calcule la hauteur pour une position
- `getTerrainDataAt(point)` : Obtient les données terrain (normale, pente)
- `getBiome(height, slope)` : Détermine le biome

## 🎯 BuildingGrid

**Responsabilités** :
- Gère une grille virtuelle adaptée à la surface sphérique
- Suit les cellules occupées
- Snapping intelligent aux positions de grille
- Gestion des voisins

**Paramètres configurables** :
```javascript
{
  cellSize: 5,      // Taille d'une cellule en unités monde
  maxSlope: 25      // Pente max pour construire (degrés)
}
```

**Méthodes principales** :
- `worldToGrid(position)` : Convertit position monde → coordonnées grille (theta, phi)
- `gridToWorld(theta, phi)` : Convertit grille → position monde
- `isCellOccupied(theta, phi)` : Vérifie si une cellule est libre
- `occupyCell(theta, phi, entityId)` : Marque une cellule comme occupée
- `getNeighborCells(theta, phi)` : Obtient les 8 cellules voisines
- `canPlaceBuilding(theta, phi)` : Validation complète (incluant voisins)

## ✅ PlacementValidator

**Responsabilités** :
- Validation multi-critères du placement
- Calcul de score de qualité (0-100)
- Vérification des règles par type de bâtiment
- Suggestions d'emplacements alternatifs

**Règles par type de bâtiment** :
| Bâtiment | Pente max | Biomes autorisés | Espace min |
|----------|-----------|------------------|------------|
| Base | 15° | plaine, colline | 2 cellules |
| Habitation | 20° | plaine, colline | 1 cellule |
| Mine | 35° | montagne, colline | 1 cellule |
| Ferme | 10° | plaine | 1 cellule |
| Usine | 15° | plaine, colline | 1 cellule |
| Centrale | 20° | plaine, colline | 2 cellules |
| Entrepôt | 15° | plaine, colline | 1 cellule |
| Route | 30° | tous | 0 (peut chevaucher) |

**Méthodes principales** :
- `validate(position, buildingType, resources)` : Validation complète
- `calculateQualityScore(data, rules)` : Score 0-100
- `getBuildingCost(type)` : Coût en ressources
- `findBestPlacementNearby(pos, type, resources)` : Trouve le meilleur emplacement
- `getValidationColor(isValid, score)` : Couleur feedback visuel

**Retour de validation** :
```javascript
{
  valid: boolean,
  reasons: ['Pente trop importante', ...],
  warnings: ['Terrain pas parfaitement plat'],
  data: {
    slope: 12.5,
    height: 5.2,
    biome: 'plain',
    qualityScore: 85,
    terrainData: {...},
    cost: { metal: 100, energy: 50 }
  }
}
```

## 🎮 BuildingPlacer (Contrôleur Input)

**Responsabilités** :
- Capture les inputs utilisateur (souris)
- Raycasting sur le terrain
- Affichage du ghost building
- Feedback visuel temps réel
- Communication avec le serveur

**Workflow** :
1. Raycasting sur le mesh de la planète
2. Obtention des coordonnées de grille snappées
3. Validation avec PlacementValidator
4. Calcul de l'offset basé sur la hauteur du bâtiment
5. Orientation perpendiculaire à la surface
6. Affichage feedback visuel (couleur + panneau d'info)

## 🖥️ Interface Utilisateur

### Panneau de Construction
- Liste des bâtiments avec coûts
- Indicateurs de ressources
- Instructions d'utilisation

### Panneau de Validation (temps réel)
Affiche dynamiquement pendant le placement :
- ✓ Statut (valide/invalide)
- 📊 Score de qualité (0-100%)
- 🏔️ Informations terrain (pente, hauteur, biome)
- ⚠️ Raisons d'invalidité
- ⚡ Avertissements

**Code couleur** :
- 🟢 Vert : Placement parfait (score ≥ 80%)
- 🟡 Jaune : Placement acceptable (score 60-79%)
- 🟠 Orange : Placement médiocre (score < 60%)
- 🔴 Rouge : Placement invalide

## 🔧 Intégration

### Initialisation dans PlanetScene
```javascript
// 1. Créer le générateur
this.planetGenerator = new PlanetGenerator({...});

// 2. Générer la planète
const geometry = this.planetGenerator.generate();
const mesh = new THREE.Mesh(geometry, material);

// 3. Créer la grille
this.buildingGrid = new BuildingGrid(this.planetGenerator, {...});

// 4. Créer le validateur
this.placementValidator = new PlacementValidator(
  this.planetGenerator,
  this.buildingGrid
);

// 5. Initialiser le placer
game.buildingPlacer.initialize(
  this.planetGenerator,
  this.buildingGrid,
  this.placementValidator
);
```

### Utilisation dans BuildingPlacer
```javascript
// Obtenir position snappée
const gridCoords = this.buildingGrid.worldToGrid(intersectionPoint);
const snappedPosition = this.buildingGrid.gridToWorld(
  gridCoords.theta, 
  gridCoords.phi
);

// Valider
const validation = this.placementValidator.validate(
  snappedPosition,
  buildingType,
  playerResources
);

// Afficher feedback
this._updateGhostVisual(validation.valid, validation.data.qualityScore);
```

## 🎨 Personnalisation

### Ajouter un nouveau biome
Dans `PlanetGenerator.getBiome()` :
```javascript
if (height > 15 && slope < 10) {
  return 'plateau';
}
```

### Modifier les règles de placement
Dans `PlacementValidator.buildingRules` :
```javascript
observatoire: {
  maxSlope: 5,
  minSpace: 3,
  allowedBiomes: ['mountain'],
  requiresFlat: true,
  preferredHeight: 12
}
```

### Ajuster la génération de terrain
```javascript
const generator = new PlanetGenerator({
  heightScale: 20,      // Plus de relief
  octaves: 6,          // Plus de détails
  seaLevel: 0,         // Pas d'océan
  mountainThreshold: 12 // Montagnes plus rares
});
```

## 🐛 Debug

### Afficher la grille visuelle
```javascript
buildingGrid.createVisualGrid(scene);
// Toggle: buildingGrid.toggleGridVisibility();
```

### Afficher l'overlay de biomes
```javascript
const overlay = planetGenerator.generateDebugOverlay();
scene.add(overlay);
```

### Statistiques de grille
```javascript
const stats = buildingGrid.getStats();
console.log(stats);
// { cellSize: 5, occupiedCells: 42, maxSlope: 25, gridVisible: true }
```

## 🚀 Performance

### Optimisations implémentées
- Génération procédurale (pas de textures lourdes)
- Cache des données de terrain
- Grille virtuelle (pas de mesh)
- Raycasting optimisé (un seul objet)
- Interpolation de données terrain

### Recommandations
- Segments planète : 128 (bon compromis qualité/perf)
- Octaves bruit : 3-4 (au-delà = coût élevé)
- Cellules grille : 5-10 unités (selon densité souhaitée)

## 📈 Évolutions futures

### Court terme
- [ ] Shader personnalisé avec texture procédurale par biome
- [ ] Système de routes connectées automatiquement
- [ ] Visualisation zones constructibles en temps réel

### Moyen terme
- [ ] Érosion et simulation géologique
- [ ] Végétation procédurale par biome
- [ ] Système de terraformation

### Long terme
- [ ] Planètes multi-biomes (tropicale, désertique, glaciale)
- [ ] Simulation atmosphérique et météo
- [ ] Détail adaptatif (LOD) basé sur la caméra

## 📚 Références

- [Perlin Noise](https://en.wikipedia.org/wiki/Perlin_noise)
- [Fractional Brownian Motion](https://thebookofshaders.com/13/)
- [Simplex Noise](https://github.com/jwagner/simplex-noise.js)
- [Spherical Coordinates](https://mathworld.wolfram.com/SphericalCoordinates.html)
