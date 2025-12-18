# 🗺️ ROADMAP SSV — Objectifs & Implémentation

> **Version cible** : SSV CORE v1.0.0  
> **Philosophie** : Réalité distribuée à autorité racinaire

---

## 📊 État d'Avancement Global

| Module | Statut | Priorité |
|--------|--------|----------|
| 🔴 Quorum de Proximité | Non implémenté | P0 |
| 🔴 Horloge de Lamport | Non implémenté | P0 |
| 🔴 Secteurs Spatiaux (DHT 3D) | Non implémenté | P1 |
| 🔴 Recettes CSG | Non implémenté | P1 |
| 🔴 Seed Nodes Sentinelles | Non implémenté | P1 |
| 🔴 Témoin Fantôme | Non implémenté | P2 |
| 🟡 Autorité Super Architecte | Partiel | P0 |
| 🟢 Réseau P2P (PeerJS) | Fonctionnel | - |
| 🟢 Rendu 3D (Three.js) | Fonctionnel | - |
| 🟢 Contrôles joueur | Fonctionnel | - |

---

## 🎯 PHASE 1 : Fondations du Maillage (P0)

### 1.1 Quorum de Proximité
**Objectif** : Valider les actions par consensus local (2 témoins minimum)

```javascript
// Structure cible
{
  type: 'intent',
  action: 'build',
  recipe: { ... },
  lamport: 42,
  witnesses: [],          // À remplir par les voisins
  requiredWitnesses: 2,
  status: 'pending'       // pending → confirmed | rejected
}
```

**Critères de validation** :
- [ ] Émetteur dans un rayon de 50 unités de l'action
- [ ] 2+ nœuds voisins confirment dans les 500ms
- [ ] Rollback si infirmé après exécution optimiste

**Fichiers à modifier** : `index.html` → `Network.requestAction()`, `Network.bindEvents()`

---

### 1.2 Horloge de Lamport
**Objectif** : Ordonnancement logique des événements sans horloge globale

```javascript
// Ajouter au State
State.lamportClock = 0;

// À chaque événement local
State.lamportClock++;

// À chaque réception
State.lamportClock = Math.max(State.lamportClock, received.lamport) + 1;
```

**Règles** :
- [ ] Remplacer `ts: Date.now()` par `lamport: State.lamportClock`
- [ ] Résoudre les conflits par `lamport` > `creatorId` (ordre déterministe)

---

### 1.3 Autorité Super Architecte (Compléter)
**Objectif** : Les "Lois" du Root s'imposent sans quorum

**Implémenté** :
- ✅ Connexion admin avec clé
- ✅ Modification gravité
- ✅ Broadcast des lois

**À ajouter** :
- [ ] Signature cryptographique des lois (ECDSA)
- [ ] Liste blanche des clés admin
- [ ] Commandes : `kick`, `ban`, `tp`, `spawn_entity`

---

## 🎯 PHASE 2 : Structuration Spatiale (P1)

### 2.1 Secteurs Spatiaux (DHT 3D)
**Objectif** : Découper le monde en chunks avec autorité locale

```javascript
// Calcul du secteur
const SECTOR_SIZE = 64;
function getSector(pos) {
  return {
    x: Math.floor(pos.x / SECTOR_SIZE),
    y: Math.floor(pos.y / SECTOR_SIZE),
    z: Math.floor(pos.z / SECTOR_SIZE)
  };
}

// Registre par secteur
State.sectors = new Map(); // "0,0,0" → { entities: Map, witnesses: Set }
```

**Bénéfices** :
- [ ] Broadcast ciblé (seulement aux nœuds du secteur)
- [ ] Cache local par secteur
- [ ] Culling réseau naturel

---

### 2.2 Recettes JSON (CSG)
**Objectif** : Transmettre la description, pas la géométrie

```javascript
// Types de recettes
const RecipeTypes = {
  BLOCK: {
    t: 'block',
    p: { x, y, z },        // Position
    s: { x: 1, y: 1, z: 1 }, // Scale
    c: 0xff0000            // Couleur
  },
  
  VOXEL: {
    t: 'voxel',
    p: { x, y, z },
    density: 0.8,          // Pour Marching Cubes
    material: 'stone'
  },
  
  CSG: {
    t: 'csg',
    op: 'subtract',        // union | subtract | intersect
    a: 'recipe_id_1',
    b: 'recipe_id_2'
  }
};
```

**Reconstruction locale** :
- [ ] Worker thread pour génération géométrie
- [ ] Cache des meshes générés
- [ ] LOD basé sur distance

---

### 2.3 Seed Nodes Sentinelles
**Objectif** : Nœuds stables pour la persistance des zones vides

```javascript
// Configuration
CONFIG.SENTINEL_NODES = [
  { id: 'sentinel-eu-1', region: 'europe', priority: 100 },
  { id: 'sentinel-us-1', region: 'americas', priority: 100 }
];

// Rôle des sentinelles
// - Stockage IndexedDB des secteurs orphelins
// - Bootstrap pour nouveaux joueurs
// - NE PAS valider les quorums (observateurs seulement)
```

---

## 🎯 PHASE 3 : Sécurité & Anti-Triche (P2)

### 3.1 Témoin Fantôme
**Objectif** : Prévenir les cartels de validation

```javascript
// À chaque action importante (build, loot, combat)
function selectGhostWitness(sectorId) {
  // Sélection pseudo-aléatoire basée sur le hash de l'action
  const allNodes = Array.from(State.connections.keys());
  const sectorNodes = getSectorNodes(sectorId);
  const outsiders = allNodes.filter(n => !sectorNodes.includes(n));
  
  // Hash déterministe pour que tout le monde choisisse le même témoin
  const hash = hashAction(action);
  return outsiders[hash % outsiders.length];
}
```

---

### 3.2 Vérification Probabiliste
**Objectif** : Valider les calculs délégués (World Boss, physique complexe)

```javascript
// 5% des calculs sont re-vérifiés par un autre nœud
if (Math.random() < 0.05) {
  const verifier = selectRandomNode();
  send(verifier, { type: 'verify_computation', task, expectedResult });
}
```

---

### 3.3 Fenêtre de Tolérance Temporelle
**Objectif** : Empêcher les "voyages dans le temps"

```javascript
const TOLERANCE_MS = 2000; // 2 secondes

function isTimestampValid(receivedTs) {
  const now = Date.now();
  return Math.abs(now - receivedTs) < TOLERANCE_MS;
}
```

---

## 🎯 PHASE 4 : Contenu de Jeu (P3)

### 4.1 Donjons & Anomalies
- [ ] Structures procédurales protégées
- [ ] Quorum renforcé (3+ témoins)
- [ ] Loot tables partagées

### 4.2 World Boss
- [ ] Entités haute priorité
- [ ] Task Stealing vers nœuds puissants
- [ ] Synchronisation 30Hz+ pour le combat

### 4.3 Système de Quêtes
- [ ] Objectifs distribués (pas de serveur de quêtes)
- [ ] Validation par smart contract local
- [ ] Récompenses signées par le Super Architecte

---

## 🎯 PHASE 5 : Optimisation (P4)

### 5.1 WebWorkers
```javascript
// Déporter hors du main thread :
// - Génération géométrie CSG
// - Marching Cubes pour voxels
// - Calculs physiques complexes
```

### 5.2 Compression & Throttling
```javascript
// Quantification des positions
const quantize = (v) => Math.round(v * 100) / 100; // 2 décimales

// Throttling basé sur distance
function getBroadcastRate(distance) {
  if (distance < 20) return 60;  // 60 Hz proche
  if (distance < 100) return 20; // 20 Hz moyen
  return 5;                       // 5 Hz lointain
}
```

### 5.3 LOD Proxy
- [ ] Meshes simplifiés pour objets > 50m
- [ ] Imposters (billboards) pour > 200m
- [ ] Culling total > 500m

---

## 📈 Métriques de Succès

| Métrique | Objectif v1.0 |
|----------|---------------|
| Latence action → confirmation | < 200ms |
| Joueurs simultanés | 20+ |
| Entités monde | 10,000+ |
| Bande passante / joueur | < 50 KB/s |
| Temps de sync nouveau joueur | < 5s |

---

## 🔗 Dépendances Techniques

```
Actuel (v0.9.7)          Cible (v1.0)
─────────────────        ─────────────────
Three.js r128            Three.js r160+
PeerJS 1.5.2             PeerJS + Y.js
Tailwind CDN             Tailwind CDN
Aucun bundler            Vite (optionnel)
```

---

## 📝 Notes d'Architecture

### Pourquoi pas de blockchain ?
- Latence incompatible avec le jeu temps réel
- Overkill pour la taille du réseau visée (< 1000 joueurs)
- Le Super Architecte EST la "chaîne de confiance"

### Pourquoi pas de serveur autoritaire ?
- Coût d'hébergement
- Single point of failure
- Philosophie : les joueurs possèdent le monde

### Pourquoi le quorum spatial ?
- Consensus global = 500ms+ de latence
- Consensus local = ~50ms
- Les tricheurs ne peuvent affecter que leur zone

---

*Dernière mise à jour : Décembre 2024*
