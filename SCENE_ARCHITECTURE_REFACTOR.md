# Phase 4 : Refactoring Complet de l'Architecture des Scènes

## Résumé des Changements

La Phase 4 a introduit une architecture de scènes unifiée et centralisée avec les composants suivants :

### 1. **SceneDirector** ([`src/scenes/SceneDirector.js`](src/scenes/SceneDirector.js))

Le gestionnaire de scènes unifié qui centralise :
- ✅ Gestion des transitions de scènes avec cycle de vie complet (init, update, teardown)
- ✅ EventBus intégré pour la communication entre scènes
- ✅ EntityFactory partagée pour la création d'entités
- ✅ Gestion automatique des ressources (cleanup)
- ✅ Suivi des scènes actives et précédentes

**Méthodes principales :**
- `registerScene(name, sceneInstance)` - Enregistrer une scène
- `switchScene(sceneName, options)` - Changer de scène
- `createEntity(type, options)` - Créer une entité
- `destroyEntity(entityId)` - Détruire une entité
- `getEventBus()` - Obtenir l'EventBus
- `getEntityFactory()` - Obtenir l'EntityFactory

### 2. **EntityFactory** ([`src/scenes/EntityFactory.js`](src/scenes/EntityFactory.js))

L'usine d'entités centralisée qui gère :
- ✅ Templates configurables pour chaque type d'entité
- ✅ Centralisation de la création des meshes Three.js
- ✅ Gestion des assets via AssetManager
- ✅ Support des variations (niveaux, couleurs, tailles)

**Types d'entités supportés :**
- **Bâtiments** : base, habitation, ferme, usine, entrepot, centrale, mine, route
- **Vaisseaux** : player, enemy, cargo
- **Planètes** : terrestre, volcanique, gazeuse
- **Systèmes stellaires** : étoiles et zones d'influence
- **Effets** : lasers, grilles de planètes

**Méthodes principales :**
- `createBuilding(type, position, options)` - Créer un bâtiment
- `createShip(name, position, faction, options)` - Créer un vaisseau
- `createPlanet(name, type, options)` - Créer une planète
- `createStarSystem(name, position, options)` - Créer un système stellaire
- `createLaser(start, end, options)` - Créer un effet laser
- `createPlanetGrid(radius, options)` - Créer une grille de planète

### 3. **EventBus** ([`src/scenes/EventBus.js`](src/scenes/EventBus.js))

Le bus d'événements léger qui fournit :
- ✅ Système de publication/abonnement
- ✅ Gestion des écouteurs par événement
- ✅ Support des événements globaux et scoped
- ✅ Nettoyage automatique des écouteurs "once"
- ✅ Gestion des contextes pour les callbacks

**Méthodes principales :**
- `on(eventName, callback, context)` - S'abonner à un événement
- `once(eventName, callback, context)` - S'abonner une seule fois
- `onAll(callback)` - Écouter tous les événements
- `off(eventName, callback)` - Se désabonner
- `emit(eventName, data)` - Émettre un événement
- `clear(eventName)` - Supprimer tous les écouteurs d'un événement
- `clearAll()` - Supprimer tous les écouteurs

## Scènes Refactorisées

### **PlanetScene** ([`src/scenes/PlanetScene.js`](src/scenes/PlanetScene.js))

**Changements :**
- ✅ Utilise `EntityFactory` pour créer la planète et la grille
- ✅ Écoute les événements `building:created` et `building:destroyed`
- ✅ Gestion centralisée des ressources via `director.registerResource()`
- ✅ Méthode `teardown()` pour le nettoyage spécifique

**Avantages :**
- Code plus propre et déclaratif
- Gestion automatique du cleanup
- Communication via EventBus au lieu d'événements DOM

### **SystemScene** ([`src/scenes/SystemScene.js`](src/scenes/SystemScene.js))

**Changements :**
- ✅ Utilise `EntityFactory` pour créer les vaisseaux
- ✅ Centralise la gestion des flottes
- ✅ Écoute les événements de combat et de création de vaisseaux
- ✅ Gestion améliorée des vaisseaux cargo

**Avantages :**
- Suppression de la logique de création manuelle
- Meilleure organisation des entités
- Gestion centralisée des ressources

### **GalaxyScene** ([`src/scenes/GalaxyScene.js`](src/scenes/GalaxyScene.js))

**Changements :**
- ✅ Utilise `EntityFactory` pour créer les systèmes stellaires
- ✅ Gestion dynamique des zones d'influence
- ✅ Écoute les événements de mise à jour de souveraineté
- ✅ Création simplifiée des systèmes de démo

**Avantages :**
- Code plus simple et maintenable
- Réactivité aux changements de souveraineté
- Gestion automatique des ressources

## SceneManager Mis à Jour ([`src/scenes/SceneManager.js`](src/scenes/SceneManager.js))

**Changements :**
- ✅ Délègue toutes les opérations au `SceneDirector`
- ✅ Garde l'interface publique existante (compatibilité)
- ✅ Fournit des méthodes d'accès au directeur et à ses composants

**Interface conservée pour compatibilité :**
- `addScene(name, sceneInstance)`
- `switchScene(name)`
- `update(deltaTime)`
- `render(renderer)`
- `onResize(width, height)`

**Nouvelles méthodes :**
- `getDirector()` - Obtenir le SceneDirector
- `getEventBus()` - Obtenir l'EventBus
- `getEntityFactory()` - Obtenir l'EntityFactory
- `createEntity(type, options)` - Créer une entité
- `destroyEntity(entityId)` - Détruire une entité

## Tests d'Intégration ([`src/scenes/test.js`](src/scenes/test.js))

Suite de tests complète qui valide :
- ✅ Fonctionnement de l'EventBus (écouteurs, once, global, unsubscribe)
- ✅ Création des templates de l'EntityFactory
- ✅ Initialisation du SceneDirector
- ✅ Intégration des scènes avec le nouveau système

**Lancement des tests :**
```javascript
import { SceneArchitectureTest } from './scenes/test.js';

const testSuite = new SceneArchitectureTest();
testSuite.runAllTests();
```

## Guide de Migration

### Pour les scènes existantes :

1. **Importer les dépendances** (fait automatiquement via SceneDirector)
2. **Utiliser `this.entityFactory`** au lieu de créer des meshes manuellement
3. **Écouter les événements via `this.eventBus`** au lieu de `window.addEventListener`
4. **Enregistrer les ressources** avec `this.director.registerResource(sceneName, type, resource)`
5. **Implémenter `teardown()`** pour le nettoyage spécifique

### Pour créer de nouvelles scènes :

```javascript
import { BaseScene } from './BaseScene.js';

export class MyScene extends BaseScene {
  async init(initData = {}) {
    // Utiliser this.entityFactory pour créer des entités
    const entity = this.director.createEntity('ship', {
      name: 'My Ship',
      position: { x: 0, y: 0, z: 0 },
      faction: 'player'
    });

    // Écouter les événements
    this.eventBus.on('custom:event', (data) => {
      // Gérer l'événement
    });

    // Enregistrer les ressources
    this.director.registerResource(this.name, 'mesh', myMesh);
  }

  update(deltaTime) {
    // Logique de mise à jour
  }

  teardown() {
    // Nettoyage spécifique
    this.eventBus.clear('custom:event');
  }
}
```

### Pour créer de nouveaux types d'entités :

1. **Ajouter un template dans EntityFactory** :
```javascript
// Dans EntityFactory.js
this.templates.myEntity = {
  geometry: () => new THREE.BoxGeometry(1, 1, 1),
  material: { color: 0xff0000 },
  scale: 1.0
};
```

2. **Ajouter une méthode de création** :
```javascript
createMyEntity(options) {
  const template = this.templates.myEntity;
  // Logique de création
}
```

3. **Ajouter le cas dans SceneDirector.createEntity()** :
```javascript
case 'myEntity':
  entity = this.entityFactory.createMyEntity(options);
  break;
```

## Événements Disponibles

### Événements de Scène :
- `scene:exiting` - Émis avant de quitter une scène
- `scene:entering` - Émis avant d'entrer dans une scène
- `scene:entered` - Émis après être entré dans une scène
- `scene:switch` - Demande de changement de scène

### Événements d'Entités :
- `entity:create` - Demande de création d'entité
- `entity:created` - Émis après la création d'une entité
- `entity:destroy` - Demande de destruction d'entité
- `entity:destroyed` - Émis après la destruction d'une entité

### Événements Spécifiques :
- `building:created` - Bâtiment créé
- `building:destroyed` - Bâtiment détruit
- `ship:created` - Vaisseau créé
- `cargo:created` - Vaisseau cargo créé
- `combat:fire` - Tir de combat
- `system:created` - Système stellaire créé
- `system:destroyed` - Système stellaire détruit
- `sovereignty:updated` - Souveraineté mise à jour

## Avantages de la Nouvelle Architecture

1. **Centralisation** : Toute la logique de gestion des scènes est au même endroit
2. **Maintenabilité** : Code plus propre et mieux organisé
3. **Testabilité** : Composants découplés et testables individuellement
4. **Évolutivité** : Ajout facile de nouveaux types d'entités et d'événements
5. **Performance** : Gestion automatique du cleanup des ressources
6. **Compatibilité** : L'ancienne interface est conservée

## Prochaines Étapes

1. **Mettre à jour les systèmes ECS** pour utiliser le nouvel EventBus
2. **Refactoriser les systèmes de réseau** pour émettre des événements
3. **Ajouter plus de types d'entités** dans EntityFactory
4. **Créer des scènes supplémentaires** (menu, options, etc.)
5. **Optimiser les performances** avec le pooling d'objets

## Fichiers Modifiés

- ✅ [`src/scenes/EventBus.js`](src/scenes/EventBus.js) - NOUVEAU
- ✅ [`src/scenes/EntityFactory.js`](src/scenes/EntityFactory.js) - NOUVEAU
- ✅ [`src/scenes/SceneDirector.js`](src/scenes/SceneDirector.js) - NOUVEAU
- ✅ [`src/scenes/PlanetScene.js`](src/scenes/PlanetScene.js) - REFACTORISÉ
- ✅ [`src/scenes/SystemScene.js`](src/scenes/SystemScene.js) - REFACTORISÉ
- ✅ [`src/scenes/GalaxyScene.js`](src/scenes/GalaxyScene.js) - REFACTORISÉ
- ✅ [`src/scenes/SceneManager.js`](src/scenes/SceneManager.js) - MIS À JOUR
- ✅ [`src/scenes/test.js`](src/scenes/test.js) - NOUVEAU

---

**Phase 4 Complétée** ✅
