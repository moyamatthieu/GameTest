# Refactoring: Utilisation de Constantes (Enums)

## Problème identifié
Le code utilisait des chaînes de caractères "en dur" pour identifier les scènes, ce qui causait des erreurs de typage :
- Incohérence entre `'planet'`, `'Planet'`, `'system'`, `'System'`, etc.
- Difficulté à naviguer entre les vues galaxie, planète et système solaire
- Risque d'erreurs de typo sans détection par l'IDE

## Solution implémentée
Création d'un système de constantes centralisées dans [`src/utils/constants.js`](src/utils/constants.js) :

```javascript
static SCENES = {
  PLANET: 'planet',
  SYSTEM: 'system',
  GALAXY: 'galaxy',
}

static NAV_IDS = {
  PLANET: 'nav-planet',
  SYSTEM: 'nav-system',
  GALAXY: 'nav-galaxy',
}
```

## Avantages
✅ **Typage sûr** : Utilisation de `Constants.SCENES.PLANET` au lieu de `'planet'`  
✅ **Autocomplétion** : L'IDE suggère les valeurs possibles  
✅ **Refactoring facile** : Changement centralisé si besoin  
✅ **Détection d'erreurs** : Les typos sont immédiatement visibles  
✅ **Navigation fonctionnelle** : Clic sur les boutons + raccourcis clavier (1, 2, 3)

## Fichiers modifiés
- [`src/utils/constants.js`](src/utils/constants.js) - Ajout des enums
- [`src/core/Game.js`](src/core/Game.js) - Utilisation des constantes + événements clic
- [`src/scenes/SceneManager.js`](src/scenes/SceneManager.js) - Utilisation des constantes
- [`src/scenes/PlanetScene.js`](src/scenes/PlanetScene.js) - Utilisation dans le constructeur
- [`src/scenes/SystemScene.js`](src/scenes/SystemScene.js) - Utilisation dans le constructeur
- [`src/scenes/GalaxyScene.js`](src/scenes/GalaxyScene.js) - Utilisation dans le constructeur
- [`src/ui/UIStore.js`](src/ui/UIStore.js) - Scène par défaut
- [`src/ui/UIManager.js`](src/ui/UIManager.js) - Comparaisons de scènes
- [`src/input/BuildingPlacer.js`](src/input/BuildingPlacer.js) - Mode de construction
- [`src/ecs/systems/ConstructionSystem.js`](src/ecs/systems/ConstructionSystem.js) - Mode de construction

## Comment utiliser
```javascript
// ❌ Ancien code (à éviter)
this.sceneManager.switchScene('planet');
if (currentScene === 'system') { ... }

// ✅ Nouveau code (recommandé)
import { Constants } from '../utils/constants.js';
this.sceneManager.switchScene(Constants.SCENES.PLANET);
if (currentScene === Constants.SCENES.SYSTEM) { ... }
```

## Tests
✅ Navigation par touches (1, 2, 3) fonctionne  
✅ Navigation par clic sur les boutons fonctionne  
✅ Transition d'écran fluide  
✅ Bouton actif mis en surbrillance  
✅ Pas d'erreurs de console
