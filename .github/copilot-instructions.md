# Galactic Dominion - Instructions de Codage IA

## 🏗️ Architecture : ECS Serveur-Autoritaire
- **Pur Serveur-Autoritaire** : Le client est "idiot" (rendu/input uniquement). Le serveur est "intelligent" (toute la logique).
- **Emplacement de la Logique** : La logique métier DOIT résider dans [common/ecs/systems/](../common/ecs/systems/) et est exécutée UNIQUEMENT par le serveur.
- **Composants** : Objets de données purs dans [common/ecs/components.js](../common/ecs/components.js). Pas de logique dans les composants.
- **Gestion du Monde** : Utilisez `world.createEntity()`, `world.addComponent(entity, 'Name', data)`, et `world.getComponent(entity, 'Name')`.

## 🌐 Réseau & État
- **Communication** : Le client envoie des requêtes via `socket.emit('requestAction', data)`. Le serveur valide et met à jour le monde ECS.
- **Synchronisation** : Le serveur diffuse les deltas d'état. Le [src/render/MeshSync.js](../src/render/MeshSync.js) du client synchronise les meshes Three.js avec l'état ECS.
- **Optimisations** : Utilise MessagePack, la compression Delta, et le Spatial Hashing (Interest Management).

## 🎮 Systèmes de Jeu
- **Multi-échelles** : Supporte les échelles Planète (Micro), Système (Meso), et Galaxie (Macro).
- **Positionnement** : Le composant `Position` inclut `referenceFrame` ('global', 'planet_surface', 'orbital').
- **Construction** : Système dual pour le placement planétaire (sphérique) et spatial (grille). Voir [src/input/BuildingPlacer.js](../src/input/BuildingPlacer.js).

## 🛠️ Workflow Développeur
- **Lancer le Dev** : `npm run dev:all` (lance le client sur :3000 et le serveur sur :3001).
- **Base de données** : SQLite avec persistance JSON dans [server/db/](../server/db/). Utilisez `DatabaseManager` pour les requêtes.
- **Tests** : 
  - Unité : `npm test` (Jest)
  - E2E : `npx playwright test`
- **Conventions** : 
  - JavaScript Vanilla (pas de frameworks comme React/Vue).
  - Minimiser les dépendances externes.
  - Mettre à jour [ARCHITECTURE.md](../ARCHITECTURE.md) ou [USAGE_GUIDE.md](../USAGE_GUIDE.md) lors de l'ajout de fonctionnalités majeures.

## 📝 Patterns de Code
- **Ajouter un Système** : Créer dans `common/ecs/systems/` en tant que fonction `(world, deltaTime) => { ... }`, enregistrer dans `server/ecs/ServerWorld.js`.
- **Ajouter un Composant** : Définir dans `common/ecs/components.js`, ajouter au bitmask `ComponentTypes`.
- **Input Client** : Gérer dans `src/input/`, envoyer l'événement au serveur, attendre que la mise à jour ECS se reflète dans `MeshSync`.
- **Requêtes** : Utilisez `world.getEntitiesWith('CompA', 'CompB')` pour un filtrage efficace des entités.
