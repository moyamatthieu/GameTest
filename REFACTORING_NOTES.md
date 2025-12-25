# 🔄 Refactorisation Majeure - Architecture Client/Serveur

## 📋 Résumé des Modifications

Cette refactorisation transforme le projet d'une architecture hybride (simulation client+serveur) vers une **architecture serveur-authoritative pure**, éliminant les risques de désynchronisation et de cheats.

---

## ✅ Changements Effectués

### 1. **Suppression des Systèmes de Simulation Côté Client**

**Avant :**
```javascript
// ❌ Le client exécutait la logique de jeu
this.world.addSystem(CombatSystem)
this.world.addSystem(SovereigntySystem)
this.fleetSystem = new FleetSystem(this.world)
this.roadSystem = new RoadSystem(this.world, this)
```

**Après :**
```javascript
// ✅ Le client ne fait que du rendu et de l'input
this.meshSync = new MeshSync(this.sceneManager, this.assetManager)
this.buildingPlacer = new BuildingPlacer(this)
```

**Impact :**
- 🛡️ **Sécurité** : Impossible de tricher en modifiant la logique client
- ⚡ **Performance** : Économie de CPU côté client
- 🔄 **Synchronisation** : Plus de désynchronisation client/serveur

---

### 2. **Création du Système de Rendu MeshSync**

**Fichier :** `src/render/MeshSync.js`

**Responsabilités :**
- Synchroniser les positions ECS → Three.js Meshes
- Créer/détruire les meshes selon les entités
- Gérer les visuels (animations, couleurs)

**Exemple d'utilisation :**
```javascript
// Dans la boucle de rendu
this.meshSync.update(this.world)
```

**Avantages :**
- 📦 Code de rendu séparé de la logique
- 🎨 Facilite l'ajout d'effets visuels
- 🧹 Nettoyage automatique des meshes orphelins

---

### 3. **Transformation de ConstructionSystem en BuildingPlacer**

**Avant :** `src/ecs/systems/ConstructionSystem.js` (système ECS)
**Après :** `src/input/BuildingPlacer.js` (gestionnaire d'input)

**Changements clés :**
```javascript
// ❌ Avant : Validation + modification ECS
validatePlacement() {
  const economy = this.world.getComponent(...)
  economy.metal -= cost.metal // Modifie directement !
}

// ✅ Après : Validation locale + requête serveur
tryPlaceBuilding() {
  if (!this._checkCanAfford()) return
  this.game.networkManager.socket.emit('requestPlacement', {...})
}
```

**Avantages :**
- 🎯 Rôle clairement défini (UI/Input uniquement)
- 🔒 Validation serveur obligatoire
- 🚀 Code plus simple et testable

---

### 4. **Simplification du NetworkManager**

**Avant :** Mapping complexe `serverToLocalEntity`
```javascript
// ❌ Problématique
this.serverToLocalEntity = new Map()
const localEntity = this.game.world.createEntity()
this.serverToLocalEntity.set(serverId, localEntity)
```

**Après :** IDs directs
```javascript
// ✅ Simple et fiable
const entityId = serverEntity.id
this.game.world.createEntity(entityId)
```

**Avantages :**
- 🔍 Debugging plus facile (mêmes IDs partout)
- 🐛 Moins de bugs liés au mapping
- 📊 Facilite l'analyse des logs

---

### 5. **Refactorisation de la Boucle Principale**

**Avant :**
```javascript
animate() {
  this.world.update(deltaTime)        // ❌ Simulation
  this.fleetSystem.update(deltaTime)   // ❌ Simulation
  this.constructionSystem.update(...)  // ❌ Simulation
}
```

**Après :**
```javascript
animate() {
  // ✅ Input uniquement
  if (this.isBuildingMode) {
    this.buildingPlacer.update(deltaTime)
  }

  // ✅ Rendu uniquement
  this.meshSync.update(this.world)
  this.sceneManager.update(deltaTime)
  this.sceneManager.render(this.renderer)
}
```

---

## 🏗️ Nouvelle Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         SERVEUR                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ServerWorld (ECS)                                    │   │
│  │ - EconomySystem                                      │   │
│  │ - CombatSystem                                       │   │
│  │ - FleetSystem                                        │   │
│  │ - LogisticsSystem                                    │   │
│  │ - SovereigntySystem                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ⬇️  Delta Snapshots                 │
└─────────────────────────────────────────────────────────────┘
                          Socket.IO
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ World (ECS - Lecture Seule)                         │   │
│  │ - Reçoit les composants du serveur                  │   │
│  │ - Stocke l'état local pour le rendu                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ MeshSync (Rendu)                                     │   │
│  │ - Synchronise ECS → Three.js                        │   │
│  │ - Gère les visuels                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ BuildingPlacer (Input)                               │   │
│  │ - Capture les actions utilisateur                   │   │
│  │ - Envoie les requêtes au serveur                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Guide de Migration pour le Code Existant

### Pattern 1 : Modifier une Entité
```javascript
// ❌ NE PLUS FAIRE (Client)
const combat = world.getComponent(entity, 'Combat')
combat.hp -= damage

// ✅ FAIRE (Client → Serveur)
networkManager.requestAttack(attackerId, targetId)

// ✅ Côté serveur, la logique reste identique
```

### Pattern 2 : Créer une Entité
```javascript
// ❌ NE PLUS FAIRE (Client)
const building = world.createEntity()
world.addComponent(building, 'Building', Building('mine'))

// ✅ FAIRE (Client → Serveur)
networkManager.requestPlacement('mine', x, y, z, 'PLANET')

// ✅ Le serveur crée l'entité et le client la reçoit via delta
```

### Pattern 3 : Ajouter un Système de Rendu
```javascript
// ✅ Nouveau système dans src/render/
export class ParticleSystem {
  update(world) {
    const entities = world.getEntitiesWith('Position', 'ParticleEmitter')
    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position')
      // Créer/mettre à jour les particules (visuel uniquement)
    }
  }
}
```

---

## 🧪 Tests de Validation

### Test 1 : Multi-Client
```bash
# Terminal 1
npm run dev:all

# Terminal 2 & 3
# Ouvrir http://localhost:3000 dans 2 onglets
# Placer un bâtiment dans l'onglet 1
# ✅ Vérifier qu'il apparaît dans l'onglet 2
```

### Test 2 : Persistence
```bash
# Placer plusieurs bâtiments
# Redémarrer le serveur
# ✅ Les bâtiments doivent réapparaître
```

### Test 3 : Ressources
```bash
# Vérifier que les ressources ne peuvent pas être modifiées côté client
# console.log() dans la console navigateur :
game.world.getComponent(game.playerEntity, 'Economy').metal = 99999
# Placer un bâtiment
# ✅ Le serveur doit rejeter si les ressources réelles sont insuffisantes
```

---

## ⚠️ Points d'Attention

### 1. **Latence Réseau**
Le client affiche l'état avec un léger délai (tick rate serveur). Pour améliorer la réactivité :
- **Phase suivante :** Client-Side Prediction
- **Interpolation :** Lisser les mouvements entre les snapshots

### 2. **Ancien Code**
Certains fichiers de l'ancienne architecture existent encore :
- `src/ecs/systems/ConstructionSystem.js` (peut être supprimé)
- Les imports de `FleetSystem` dans certaines scènes

**TODO :** Nettoyer les fichiers obsolètes

### 3. **Renderable Components**
Le serveur n'a pas de composants `Renderable`. Le client les crée localement dans `NetworkManager.syncWorld()` et `MeshSync` les utilise.

---

## 🚀 Prochaines Étapes

1. **Delta Compression Efficace**
   - Remplacer la comparaison JSON par des champs spécifiques
   - Utiliser `msgpack` ou un protocole binaire

2. **Spatial Hashing (AOI)**
   - Implémenter une grille spatiale côté serveur
   - Envoyer uniquement les entités proches du joueur

3. **Client-Side Prediction**
   - Prédire le mouvement du joueur pour masquer la latence
   - Réconcilier avec l'état serveur à réception

4. **Interpolation**
   - Buffer de 100ms pour lisser les mouvements
   - Facilite le rendu fluide à 60 FPS malgré un tick serveur à 10 Hz

---

## 📚 Ressources

- [ECS Architecture](https://en.wikipedia.org/wiki/Entity_component_system)
- [Client-Server Game Architecture](https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/)
- [Fast-Paced Multiplayer](https://www.gabrielgambetta.com/client-server-game-architecture.html)

---

**Date de refactorisation :** 24 décembre 2025
**Version :** 2.0.0 (Architecture Serveur-Authoritative)
