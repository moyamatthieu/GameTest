# 🎮 Guide d'Utilisation - Nouvelle Architecture

## 🎯 Philosophie

**Le client est stupide. Le serveur est intelligent.**

- ✅ Le client **affiche** l'état du jeu
- ✅ Le client **capture** les inputs utilisateur
- ❌ Le client **ne calcule jamais** de logique métier
- ❌ Le client **ne modifie jamais** les données directement

---

## 📖 Patterns d'Utilisation

### 1. Ajouter un Nouveau Type de Bâtiment

#### Étape 1 : Serveur - Ajouter la logique
```javascript
// server/index.js
socket.on('requestPlacement', ({ type, x, y, z, playerId }) => {
  const costs = {
    // ... bâtiments existants
    nouveau_batiment: { metal: 150, energy: 50 }
  }

  // Validation et création
  const building = world.createEntity()
  world.addComponent(building, 'Building', Building(type))
  world.addComponent(building, 'Position', Position(x, y, z))
  
  // Ajouter la chaîne de production si nécessaire
  if (type === 'nouveau_batiment') {
    world.addComponent(building, 'ProductionChain', 
      ProductionChain({ metal: 2 }, { credits: 10 }, 2000))
  }
})
```

#### Étape 2 : Client - Ajouter l'UI
```html
<!-- src/ui/overlay.html -->
<button class="build-btn" data-type="nouveau_batiment">
  🏗️ Nouveau Bâtiment (150M)
</button>
```

#### Étape 3 : Client - Ajouter le rendu
```javascript
// src/render/MeshSync.js - Méthode getBuildingGeometry
case 'nouveau_batiment':
  return this.assetManager.getGeometry('geo_nouveau', 
    () => new THREE.CylinderGeometry(2, 2, 3, 8))
```

✅ **C'est tout !** Le reste est automatique via MeshSync.

---

### 2. Ajouter une Action Joueur (Exemple : Réparer)

#### Étape 1 : Client - Créer le bouton
```javascript
// src/core/Game.js - initEventListeners
document.getElementById('repair-btn').addEventListener('click', () => {
  if (this.selectedEntityId) {
    this.networkManager.requestRepair(this.selectedEntityId)
  }
})
```

#### Étape 2 : NetworkManager - Ajouter la méthode
```javascript
// src/core/NetworkManager.js
requestRepair(entityId) {
  this.socket.emit('requestRepair', {
    entityId,
    playerId: this.playerEntityId
  })
}
```

#### Étape 3 : Serveur - Implémenter la logique
```javascript
// server/index.js
socket.on('requestRepair', ({ entityId, playerId }) => {
  const economy = world.getComponent(playerId, 'Economy')
  const combat = world.getComponent(entityId, 'Combat')
  
  const repairCost = 50
  
  if (economy.metal >= repairCost && combat) {
    economy.metal -= repairCost
    combat.hp = combat.maxHp
    console.log(`Entity ${entityId} repaired`)
  } else {
    socket.emit('requestRejected', { reason: 'Insufficient resources' })
  }
})
```

---

### 3. Ajouter un Effet Visuel (Particules)

Les effets visuels sont **purement client**, donc pas de serveur impliqué.

#### Créer un ParticleSystem
```javascript
// src/render/ParticleSystem.js
import * as THREE from 'three'

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.particles = []
  }

  createExplosion(position) {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.PointsMaterial({ 
      color: 0xff0000, 
      size: 0.5 
    })
    
    const particleCount = 100
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 5
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 5
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const points = new THREE.Points(geometry, material)
    this.scene.add(points)
    this.particles.push({ points, life: 1.0 })
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.life -= deltaTime
      
      if (particle.life <= 0) {
        this.scene.remove(particle.points)
        particle.points.geometry.dispose()
        particle.points.material.dispose()
        this.particles.splice(i, 1)
      } else {
        particle.points.material.opacity = particle.life
      }
    }
  }
}
```

#### L'utiliser dans Game.js
```javascript
// src/core/Game.js - constructor
this.particleSystem = new ParticleSystem(this.sceneManager.currentScene.scene)

// Écouter les événements de combat
window.addEventListener('combat-fire', (e) => {
  this.particleSystem.createExplosion(e.detail.targetPos)
})

// Dans animate()
this.particleSystem.update(deltaTime)
```

---

### 4. Ajouter un Nouveau Système de Jeu (Exemple : Diplomatie)

#### Étape 1 : Définir les Composants
```javascript
// common/ecs/components.js
export const ComponentTypes = {
  // ... existants
  Diplomacy: 1 << 22,
}

export const Diplomacy = (faction = 'neutral') => ({
  faction,
  relations: {}, // { factionId: reputation (-100 à +100) }
  treaties: []   // Liste des traités actifs
})
```

#### Étape 2 : Créer le Système Serveur
```javascript
// common/ecs/systems/DiplomacySystem.js
export const DiplomacySystem = (world, deltaTime) => {
  const entities = world.getEntitiesWith('Diplomacy', 'Sovereignty')
  
  for (const entity of entities) {
    const diplomacy = world.getComponent(entity, 'Diplomacy')
    const sovereignty = world.getComponent(entity, 'Sovereignty')
    
    // Logique : dégrader les relations si taxation excessive, etc.
    for (const [factionId, reputation] of Object.entries(diplomacy.relations)) {
      if (sovereignty.taxRate > 0.5) {
        diplomacy.relations[factionId] -= 0.1 * deltaTime
      }
    }
  }
}
```

#### Étape 3 : Enregistrer le Système Serveur
```javascript
// server/ecs/ServerWorld.js
import { DiplomacySystem } from '../../common/ecs/systems/DiplomacySystem.js'

export class ServerWorld extends World {
  constructor() {
    super()
    this.addSystem(EconomySystem)
    this.addSystem(DiplomacySystem) // ✅
    // ...
  }
}
```

#### Étape 4 : Client - Afficher les Infos
```javascript
// src/ui/UIManager.js
updateDiplomacyPanel(entity) {
  const diplomacy = this.world.getComponent(entity, 'Diplomacy')
  if (!diplomacy) return
  
  const panel = document.getElementById('diplomacy-panel')
  panel.innerHTML = `
    <h3>Relations Diplomatiques</h3>
    ${Object.entries(diplomacy.relations).map(([faction, rep]) => `
      <div>${faction}: ${rep > 0 ? '🟢' : '🔴'} ${rep.toFixed(0)}</div>
    `).join('')}
  `
}
```

---

## 🚫 Anti-Patterns à Éviter

### ❌ Anti-Pattern 1 : Modifier les Composants Côté Client
```javascript
// ❌ JAMAIS FAIRE ÇA
const economy = game.world.getComponent(playerId, 'Economy')
economy.metal += 1000 // Le serveur ne le verra jamais !
```

**Solution :**
```javascript
// ✅ Créer une requête serveur
networkManager.requestCheat('add_resources', { metal: 1000 })
```

---

### ❌ Anti-Pattern 2 : Logique dans les Event Listeners
```javascript
// ❌ MAUVAIS
document.getElementById('attack-btn').addEventListener('click', () => {
  const target = game.selectedEntityId
  const combat = game.world.getComponent(playerId, 'Combat')
  combat.targetId = target // Modification locale !
})
```

**Solution :**
```javascript
// ✅ BON
document.getElementById('attack-btn').addEventListener('click', () => {
  game.networkManager.requestAttack(playerId, game.selectedEntityId)
})
```

---

### ❌ Anti-Pattern 3 : Système de Rendu qui Modifie l'État
```javascript
// ❌ MAUVAIS
class BadMeshSync {
  update(world) {
    const entities = world.getEntitiesWith('Position')
    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position')
      pos.x += 0.1 // ❌ Modification de l'état !
    }
  }
}
```

**Solution :**
```javascript
// ✅ BON
class GoodMeshSync {
  update(world) {
    const entities = world.getEntitiesWith('Position')
    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position')
      const mesh = this.getMesh(entity)
      mesh.position.set(pos.x, pos.y, pos.z) // ✅ Lecture seule
    }
  }
}
```

---

## 🔍 Debugging

### Voir l'État du Serveur
```javascript
// Dans la console serveur Node.js
console.log('Entities:', Array.from(world.entities))
console.log('Economy:', world.getComponent(1, 'Economy'))
```

### Voir l'État du Client
```javascript
// Dans la console du navigateur
game.world.entities
game.world.getComponent(game.playerEntity, 'Economy')
```

### Comparer Client/Serveur
```javascript
// Serveur
const serverEconomy = world.getComponent(playerId, 'Economy')
console.log('Server metal:', serverEconomy.metal)

// Client (dans la console navigateur)
const clientEconomy = game.world.getComponent(game.playerEntity, 'Economy')
console.log('Client metal:', clientEconomy.metal)

// Ils doivent être identiques (à ±1 près selon le tick)
```

---

## 📊 Métriques de Performance

### Mesurer la Latence Réseau
```javascript
// Client
const start = Date.now()
networkManager.socket.emit('ping', start)

networkManager.socket.on('pong', (timestamp) => {
  const latency = Date.now() - timestamp
  console.log(`Latency: ${latency}ms`)
})
```

### Compter les Entités Rendues
```javascript
// Dans MeshSync.update()
console.log(`Rendering ${this.entityMeshes.size} entities`)
```

---

## 🎓 Exercices Pratiques

### Exercice 1 : Ajouter un Bouton "Vendre Ressources"
1. Créer le bouton UI
2. Créer `networkManager.requestSell(resource, amount)`
3. Implémenter la logique serveur (convertir ressources → crédits)

### Exercice 2 : Afficher des Trails de Vaisseaux
1. Créer `TrailRenderer` dans `src/render/`
2. Stocker les 10 dernières positions de chaque vaisseau
3. Dessiner des lignes entre les positions

### Exercice 3 : Ajouter une Notification Toast
1. Créer `ToastManager` dans `src/ui/`
2. Écouter les événements `requestRejected`
3. Afficher un message visuel pendant 3 secondes

---

## 📚 Ressources Avancées

- **Client-Side Prediction :** https://gabrielgambetta.com/client-side-prediction-server-reconciliation.html
- **Entity Interpolation :** https://www.gabrielgambetta.com/entity-interpolation.html
- **Fast-Paced Multiplayer :** https://www.gabrielgambetta.com/client-server-game-architecture.html

---

**Happy Coding! 🚀**
