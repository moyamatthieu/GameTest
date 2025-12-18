# 🎮 Specs Minimalistes — Jeu 3D P2P Décentralisé

> **Philosophie** : Le minimum qui fonctionne, architecturé pour scaler.

---

## 🎯 Vision en Une Phrase

**Un Minecraft-like dans le navigateur où les joueurs SONT le serveur.**

---

## 📐 Architecture Fondamentale

```
┌─────────────────────────────────────────────────────────────┐
│                         JOUEUR                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Three.js   │  │    Y.js     │  │     IndexedDB       │  │
│  │   Rendu 3D  │◄─│  Sync CRDT  │◄─│  Persistence locale │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │ WebRTC
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    RÉSEAU P2P (Mesh)                         │
│     Joueur A ◄──────► Joueur B ◄──────► Joueur C            │
│         ▲                                    ▲               │
│         └────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧱 Les 3 Couches Essentielles

### Layer 1 : Données Temps Réel (Éphémères)
```
Quoi     : Positions, rotations, animations des joueurs
Fréquence: 20-60 Hz
Transport: WebRTC DataChannel (unreliable, unordered)
Stockage : Mémoire seulement (pas de persistence)
```

### Layer 2 : État du Monde (Persistant)
```
Quoi     : Blocks, constructions, objets placés
Fréquence: Événementiel (quand ça change)
Transport: Y.js CRDT via WebRTC
Stockage : IndexedDB local + sync P2P
```

### Layer 3 : Métadonnées (Persistant)
```
Quoi     : Config monde, liste joueurs connus, chat history
Fréquence: Rare
Transport: Y.js CRDT
Stockage : IndexedDB
```

---

## 📦 Structure de Données Minimale

```javascript
// === MONDE (Y.Doc persistant) ===
{
  meta: {
    worldId: "uuid",           // Identifiant unique du monde
    name: "Mon Monde",
    createdAt: timestamp,
    seed: 12345                // Pour génération procédurale
  },
  
  chunks: {
    "0,0,0": {                 // Clé = coordonnées chunk
      blocks: {
        "3,5,2": "stone",      // Position locale → type
        "3,6,2": "dirt"
      },
      modifiedAt: timestamp
    }
  }
}

// === JOUEURS (Y.Map éphémère, non persisté) ===
{
  "player_abc": {
    position: { x: 0, y: 10, z: 0 },
    rotation: { y: 0 },
    name: "Alice",
    color: "#ff5500"
  }
}
```

---

## 🔌 Stack Technique

| Besoin | Solution | Pourquoi |
|--------|----------|----------|
| Rendu 3D | **Three.js** | Standard, performant, documenté |
| Sync P2P | **Y.js + y-webrtc** | CRDT battle-tested, WebRTC intégré |
| Persistence | **y-indexeddb** | Automatique avec Y.js |
| Signaling | **Serveurs publics Y.js** | Gratuit, rien à héberger |
| Identité | **Clé publique ECDSA** | Pas de serveur d'auth |

---

## 🚀 Chemin de Scaling

### Niveau 0 : Solo (1 joueur)
```
[Toi] ──► IndexedDB local
```
Fonctionne hors-ligne, zéro réseau.

### Niveau 1 : LAN (2-5 joueurs)
```
[A] ◄──► [B] ◄──► [C]
     WebRTC direct
```
Mesh complet, tout le monde parle à tout le monde.

### Niveau 2 : Internet (5-20 joueurs)  
```
[A]──┐          ┌──[D]
[B]──┼── [HUB] ─┼──[E]
[C]──┘          └──[F]
```
Un joueur "bien connecté" devient hub naturel.

### Niveau 3 : Scale (20-100 joueurs)
```
    [Super-Node 1]     [Super-Node 2]
         │                   │
    ┌────┴────┐         ┌────┴────┐
  [A][B][C][D][E]    [F][G][H][I][J]
```
Super-nodes = joueurs volontaires avec bonne connexion.
Sharding géographique des chunks.

### Niveau 4 : Massif (100+ joueurs)
```
Même principe + incentives (tokens, badges, priorité)
```

---

## 🔑 Identité Minimaliste

```javascript
// À la première visite, générer une paire de clés
const keyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);

// L'identité = hash de la clé publique
const playerId = await hashPublicKey(keyPair.publicKey);
// Exemple: "a7f3b2c1d4e5..."

// Stockée dans localStorage, jamais transmise en clair
localStorage.setItem("playerKeyPair", await exportKey(keyPair));
```

**Propriétés** :
- ✅ Unique et vérifiable cryptographiquement
- ✅ Pas de serveur d'inscription
- ✅ Peut signer ses messages (anti-usurpation)
- ❌ Perdu si localStorage effacé (backup = export de clé)

---

## 🛡️ Anti-Triche Pragmatique

### Ce qu'on peut faire sans serveur central :

| Menace | Solution Minimaliste |
|--------|---------------------|
| **Position impossible** | Validation côté client des autres (ignorer si incohérent) |
| **Spam de blocs** | Rate-limiting local (max 10 blocs/seconde d'un même joueur) |
| **Usurpation d'identité** | Signature des messages avec clé privée |
| **Joueur toxique** | Vote de kick (majorité = déconnexion forcée) |

### Ce qu'on accepte :
- Un tricheur peut tricher pour lui-même (voler dans son client)
- Les autres le voient comme buggé et l'ignorent
- Pas de compétition = pas d'enjeu à tricher

---

## 📁 Structure de Fichiers Cible

```
/src
├── main.js              # Point d'entrée
├── world/
│   ├── World.js         # Gestion Y.Doc monde
│   ├── Chunk.js         # Un chunk de blocs
│   └── ChunkManager.js  # Chargement/déchargement
├── player/
│   ├── LocalPlayer.js   # Joueur contrôlé
│   ├── RemotePlayer.js  # Représentation des autres
│   └── Identity.js      # Clés et signature
├── network/
│   ├── P2PManager.js    # WebRTC via Y.js
│   ├── MessageTypes.js  # Types de messages
│   └── Sync.js          # Logique de sync
├── render/
│   ├── Renderer.js      # Three.js setup
│   ├── BlockMesh.js     # Rendu des blocs
│   └── PlayerMesh.js    # Rendu des avatars
└── ui/
    ├── HUD.js           # Interface
    └── Chat.js          # Chat P2P
```

---

## ✅ Critères de Succès (MVP)

### Must Have
- [ ] 2 joueurs se voient bouger en temps réel
- [ ] Un joueur pose un bloc, l'autre le voit
- [ ] Refresh page → le bloc est toujours là
- [ ] Fermer/rouvrir → reconnexion automatique

### Should Have
- [ ] Identité persistante (même pseudo après refresh)
- [ ] 5+ joueurs simultanés sans lag notable
- [ ] Monde de 10x10 chunks minimum

### Nice to Have
- [ ] Chat textuel
- [ ] Différents types de blocs
- [ ] Son basique

---

## 🚫 Hors Scope (pour l'instant)

- ❌ Récupération de compte élaborée
- ❌ Système de modération complexe
- ❌ Kubernetes / infrastructure
- ❌ Tokens / incentives économiques
- ❌ Anti-cheat sophistiqué
- ❌ Mobile

---

## 🔮 Points d'Extension (pour plus tard)

Ces "hooks" sont prévus mais pas implémentés :

```javascript
// Dans P2PManager.js
class P2PManager {
  // HOOK: Remplacer par super-node routing
  async broadcast(message) { ... }
  
  // HOOK: Ajouter validation consensus
  async validateWorldChange(change) { return true; }
  
  // HOOK: Système de réputation
  getPeerTrust(peerId) { return 1.0; }
}

// Dans Identity.js
class Identity {
  // HOOK: Multi-device sync
  async exportForBackup() { ... }
  
  // HOOK: Vérification sociale
  async linkToExternalId(provider) { ... }
}
```

---

## 📊 Métriques de Performance Cibles

| Métrique | Cible MVP | Cible Scale |
|----------|-----------|-------------|
| Latence position | < 100ms | < 50ms |
| Joueurs simultanés | 5 | 100+ |
| Chunks chargés | 9 (3x3) | 25 (5x5) |
| Blocs par chunk | 16³ = 4096 | 32³ = 32768 |
| Bande passante/joueur | < 50 KB/s | < 100 KB/s |

---

## 🏁 Prochaines Étapes

1. **Valider le code existant** — Est-ce que ça sync déjà ?
2. **Séparer les layers** — Position vs Monde
3. **Implémenter chunks** — Structure de données
4. **Tester à 2** — Ouvrir 2 onglets ou 2 machines
5. **Itérer** — Fix ce qui casse

---

*Ce document est la source de vérité. L'ancien ARCHITECTURE.md devient une "vision long terme" à consulter plus tard.*
