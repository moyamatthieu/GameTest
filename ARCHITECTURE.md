# Architecture SSV CORE — Maillage Spatial Distribué

## 🎯 Objectif

Créer un jeu 3D multijoueur **vraiment décentralisé** où :
- Chaque joueur est un nœud du mesh P2P (pas de serveur autoritaire)
- Architecture mesh pure avec PeerJS et système de recettes JSON
- Synchronisation temps réel via broadcast direct
- Le système reste simple et élégant (1 fichier HTML standalone)

---

## 🧠 Philosophie de conception

### Principes fondamentaux

1. **Chaque joueur = Un nœud du mesh P2P**
   - Connexion WebRTC directe avec tous les autres joueurs
   - État du monde en mémoire (Map JavaScript)
   - Persistance IndexedDB prévue en Phase 2

2. **Recettes JSON comme primitif de synchronisation**
   - Chaque modification = une "recette" JSON structurée
   - Broadcast direct à tous les pairs connectés
   - Application optimiste locale puis consensus implicite

3. **Broadcast haute fréquence**
   - Positions joueurs : ~22 Hz (CONFIG.BROADCAST_MS = 45ms)
   - Modifications monde : événementiel
   - Lois physiques : propagées par les super-architectes

4. **Chunking spatial (Phase 2)**
   - Le monde sera divisé en chunks 16×16×16
   - Chargement/déchargement dynamique selon proximité
   - Réduction de la charge mémoire et réseau

---

## 🏗️ Architecture technique

### Structure des données

```
World (CRDT Map)
├── meta/
│   ├── version
│   ├── seed
│   └── rules
├── chunks/
│   ├── chunk_0_0_0/
│   │   ├── blocks: Map<position, blockType>
│   │   ├── entities: Map<id, entityData>
│   │   └── lastModified: timestamp
│   ├── chunk_1_0_0/
│   └── ...
└── players/
    ├── player_abc123/
    │   ├── position: {x, y, z}
    │   ├── rotation: {x, y, z}
    │   ├── name: string
    │   ├── lastSeen: timestamp
    │   └── inventory: Map
    └── ...
```

### Layers de synchronisation

```
┌─────────────────────────────────────────────────────┐
│                    LAYER 4: UI                      │
│         Three.js Scene + Tailwind Interface         │
├─────────────────────────────────────────────────────┤
│                 LAYER 3: GAME ENGINE                │
│      Physique, Caméra, Contrôles, Rendu 3D         │
├─────────────────────────────────────────────────────┤
│                 LAYER 2: NETWORK MESH               │
│       PeerJS - Broadcast P2P Direct (~22Hz)         │
├─────────────────────────────────────────────────────┤
│               LAYER 1: STATE MANAGEMENT             │
│     Recettes JSON + worldRegistry (Mémoire)         │
│     IndexedDB prévu en Phase 2                      │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Optimisation des performances

### 1. Séparation haute/basse fréquence

| Type de données | Fréquence | Méthode | Persistance |
|-----------------|-----------|---------|-------------|
| Position joueur | ~22 Hz | PeerJS broadcast | Non |
| Rotation joueur | ~22 Hz | PeerJS broadcast | Non |
| Construction bloc | Événementiel | Recette JSON broadcast | Mémoire volatile |
| Lois physiques | Événementiel | Admin broadcast | Appliqué localement |
| Chat (prévu) | Événementiel | PeerJS broadcast | Phase 2 |

### 2. Chunking intelligent

```javascript
// Rayon de chargement (en chunks)
const CHUNK_RADIUS = {
  SYNC_FULL: 2,      // Synchronisation complète
  SYNC_LIGHT: 4,     // Métadonnées seulement
  UNLOAD: 6          // Déchargement mémoire
};

// Un chunk = 16x16x16 blocs = 4096 blocs max
const CHUNK_SIZE = 16;
```

### 3. Interpolation côté client

```javascript
// Les positions reçues sont interpolées, pas appliquées directement
// Cela lisse le mouvement malgré les fluctuations réseau
player.targetPosition = receivedPosition;
player.position.lerp(player.targetPosition, 0.2);
```

### 4. Compression des deltas

```javascript
// Avant: envoyer chaque bloc modifié
{ type: 'block', x: 10, y: 5, z: 3, blockType: 'stone' }

// Après: grouper les modifications par batch
{ 
  type: 'blocks_batch',
  chunkId: '0_0_0',
  changes: [[10,5,3,'stone'], [10,5,4,'stone'], ...]
}
```

---

## 🔄 Cycle de vie des données

### Connexion d'un joueur

```
1. Saisir identifiant nœud (login screen)
         ↓
2. Créer instance PeerJS (CONFIG.APP_PREFIX + username)
         ↓
3. Gossip protocol : tenter connexion aux DISCOVERY_NODES
         ↓
4. Recevoir sync_world des pairs déjà connectés
         ↓
5. Appliquer toutes les recettes reçues localement
         ↓
6. Prêt à jouer! (broadcast position démarre)
```

### Modification du monde (Système de Recettes)

```
1. Joueur clique pour placer un bloc
         ↓
2. Génération de la recette JSON
         ↓
3. Application OPTIMISTE locale (rendu immédiat)
         ↓
4. Broadcast { type: 'intent_build', recipe } à tous
         ↓
5. Chaque pair reçoit et applique la recette
         ↓
6. Consensus implicite (pas de rejet = accepté)
```

### Déconnexion d'un joueur

```
1. Joueur se déconnecte (volontaire ou crash)
         ↓
2. Ses modifications sont DÉJÀ chez les autres pairs
         ↓
3. Ses modifications sont DÉJÀ dans son IndexedDB local
         ↓
4. Les autres pairs gardent le monde à jour
         ↓
5. À sa reconnexion: resync automatique via CRDT
```

---

## 📦 Structure des fichiers proposée

```
src/
├── core/
│   ├── Game.js              # Boucle principale
│   ├── World.js             # Gestion du monde (chunks)
│   └── Player.js            # Entité joueur
├── network/
│   ├── P2PNetwork.js        # Gestion WebRTC + Y.js
│   ├── SyncManager.js       # Orchestration sync
│   └── StateBuffer.js       # Buffer pour haute fréquence
├── world/
│   ├── Chunk.js             # Gestion d'un chunk
│   ├── Block.js             # Types de blocs
│   └── ChunkLoader.js       # Chargement/déchargement
├── persistence/
│   ├── LocalStorage.js      # Wrapper IndexedDB
│   └── WorldSerializer.js   # Sérialisation chunks
├── render/
│   ├── Renderer.js          # Three.js setup
│   ├── ChunkMesh.js         # Mesh optimisé par chunk
│   └── PlayerModel.js       # Modèle joueur
└── utils/
    ├── Vector3.js
    ├── AABB.js              # Collisions
    └── EventEmitter.js
```

---

## 🚀 Architecture Cloud Décentralisé — Vision avancée

### L'idée centrale

> **Et si chaque joueur avec une bonne connexion pouvait contribuer à l'infrastructure du jeu ?**

```
┌─────────────────────────────────────────────────────────────┐
│           CLOUD DISTRIBUÉ DE JOUEURS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cloud classique:                                          │
│  ┌─────────────────────────────────────────┐               │
│  │         AWS / Google Cloud              │               │
│  │         (centralisé, payant)            │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Notre vision:                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │Node │ │Node │ │Node │ │Node │ │Node │                  │
│  │Paris│ │Lyon │ │Tokyo│ │NYC  │ │Berlin                  │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘                  │
│     └───────┴───────┴───────┴───────┘                      │
│              Réseau auto-organisé                          │
│              (décentralisé, gratuit)                       │
│                                                             │
│  Chaque nœud = Un joueur avec fibre qui fait tourner       │
│  un petit serveur (Docker/K3s) sur son PC                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Pourquoi c'est possible MAINTENANT

| Facteur | Il y a 10 ans | Aujourd'hui |
|---------|---------------|-------------|
| **Connexion maison** | ADSL 10 Mbps | Fibre 1-10 Gbps |
| **Latence** | 50-100ms | 5-15ms |
| **CPU moyen** | 2-4 cores | 8-16 cores |
| **RAM moyenne** | 4-8 GB | 16-32 GB |
| **Containerisation** | Complexe (VMs) | Simple (Docker) |
| **Orchestration légère** | Inexistante | K3s, Nomad |
| **WebRTC** | Expérimental | Standard mature |

**→ Un PC gamer moyen + fibre = meilleur que beaucoup de serveurs cloud d'il y a 5 ans**

---

### Architecture "Fog Computing" pour le jeu

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE FOG GAMING                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NIVEAU 3 : BACKBONE (optionnel)                           │
│  ───────────────────────────────────────────────────────── │
│  • Quelques serveurs "seed" toujours disponibles           │
│  • Peuvent être des VPS à 5€/mois                          │
│  • Ou des joueurs dédiés avec serveur 24/7                 │
│                                                             │
│        ┌─────────┐           ┌─────────┐                   │
│        │ Seed 1  │◄─────────►│ Seed 2  │                   │
│        │ (VPS)   │           │ (Dédié) │                   │
│        └────┬────┘           └────┬────┘                   │
│             │                     │                         │
│  ═══════════╪═════════════════════╪═════════════════════   │
│             │                     │                         │
│  NIVEAU 2 : SUPER-NŒUDS (contributeurs)                    │
│  ───────────────────────────────────────────────────────── │
│  • Joueurs avec fibre qui font tourner un container        │
│  • Récompensés (cosmétiques, badges, priorité)             │
│  • Auto-élection basée sur performance                     │
│                                                             │
│     ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│     │SuperNode │    │SuperNode │    │SuperNode │          │
│     │ Alice    │◄──►│  Bob     │◄──►│ Charlie  │          │
│     │ (Fibre)  │    │ (Fibre)  │    │ (Fibre)  │          │
│     └────┬─────┘    └────┬─────┘    └────┬─────┘          │
│          │               │               │                  │
│  ════════╪═══════════════╪═══════════════╪════════════════ │
│          │               │               │                  │
│  NIVEAU 1 : JOUEURS (clients légers)                       │
│  ───────────────────────────────────────────────────────── │
│  • Joueurs normaux                                         │
│  • Se connectent au super-nœud le plus proche              │
│  • Peuvent devenir super-nœud s'ils veulent                │
│                                                             │
│     [J1] [J2] [J3]     [J4] [J5]      [J6] [J7] [J8]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Auto-scaling décentralisé

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-SCALING DYNAMIQUE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SITUATION 1 : Peu de joueurs (5)                          │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│     SuperNode 1 (actif)     SuperNode 2 (veille)           │
│         │                                                   │
│    ┌────┼────┐                                              │
│    ▼    ▼    ▼                                              │
│   J1   J2   J3   J4   J5                                   │
│                                                             │
│   → 1 seul super-nœud suffit                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SITUATION 2 : Beaucoup de joueurs (50)                    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│   SuperNode 1    SuperNode 2    SuperNode 3    SuperNode 4 │
│       │              │              │              │        │
│   ┌───┼───┐      ┌───┼───┐      ┌───┼───┐      ┌───┼───┐   │
│   ▼   ▼   ▼      ▼   ▼   ▼      ▼   ▼   ▼      ▼   ▼   ▼   │
│   J1-J12        J13-J25        J26-J38        J39-J50      │
│                                                             │
│   → 4 super-nœuds activés automatiquement                  │
│   → Chaque super-nœud gère ~12 joueurs                     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ALGORITHME D'AUTO-SCALE                                   │
│                                                             │
│  Si (joueurs_par_supernode > 15) {                         │
│    activer_nouveau_supernode()                             │
│  }                                                          │
│  Si (joueurs_par_supernode < 5 && supernodes > 1) {        │
│    désactiver_supernode()                                  │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Container léger pour super-nœud

Chaque super-nœud fait tourner un container Docker simple :

```yaml
# docker-compose.yml pour un super-nœud
version: '3.8'
services:
  game-node:
    image: gamep2p/supernode:latest
    ports:
      - "8080:8080"      # WebSocket
      - "3478:3478/udp"  # TURN (optionnel)
    environment:
      - NODE_ID=${HOSTNAME}
      - NETWORK_SECRET=shared_secret
      - MAX_PLAYERS=20
      - REGION=europe-west
    volumes:
      - ./data:/app/data  # Persistance locale
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

```javascript
// Code du super-nœud (Node.js)
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { Raft } = require('raft-consensus');

class SuperNode {
  constructor(config) {
    this.nodeId = config.nodeId;
    this.players = new Map();
    this.peerNodes = new Map();
    this.worldState = new CRDTWorld();
    
    // Consensus Raft entre super-nœuds
    this.raft = new Raft({
      nodeId: this.nodeId,
      peers: config.knownPeers,
      onLeaderElected: (leader) => this.onLeaderChange(leader),
      onCommit: (entry) => this.applyToWorld(entry)
    });
  }
  
  // Accepter un joueur
  onPlayerConnect(ws, playerInfo) {
    // Vérifier la capacité
    if (this.players.size >= this.maxPlayers) {
      // Rediriger vers un autre super-nœud
      const alternative = this.findLessLoadedNode();
      ws.send(JSON.stringify({ 
        type: 'REDIRECT', 
        node: alternative.address 
      }));
      return;
    }
    
    this.players.set(playerInfo.id, { ws, info: playerInfo });
    this.broadcastPlayerList();
  }
  
  // Équilibrage de charge dynamique
  rebalance() {
    const avgLoad = this.getNetworkAverageLoad();
    const myLoad = this.players.size / this.maxPlayers;
    
    if (myLoad > avgLoad * 1.5) {
      // Je suis surchargé, migrer des joueurs
      const toMigrate = Math.floor((myLoad - avgLoad) * this.maxPlayers);
      this.migratePlayersTo(this.findLessLoadedNode(), toMigrate);
    }
  }
}
```

---

### K3s pour orchestration légère

```
┌─────────────────────────────────────────────────────────────┐
│                    K3S DISTRIBUÉ                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  K3s = Kubernetes ultra-léger (40 MB)                      │
│  Peut tourner sur un Raspberry Pi ou un PC gamer           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 CLUSTER K3S DISTRIBUÉ               │   │
│  │                                                      │   │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐        │   │
│  │   │  Node   │    │  Node   │    │  Node   │        │   │
│  │   │ Master  │◄──►│ Worker  │◄──►│ Worker  │        │   │
│  │   │(VPS 5€) │    │(Alice)  │    │ (Bob)   │        │   │
│  │   └─────────┘    └─────────┘    └─────────┘        │   │
│  │        │              │              │              │   │
│  │        └──────────────┼──────────────┘              │   │
│  │                       │                             │   │
│  │              ┌────────▼────────┐                    │   │
│  │              │   Service Mesh  │                    │   │
│  │              │   (Linkerd)     │                    │   │
│  │              └─────────────────┘                    │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Avantages K3s :                                           │
│  • Ultra léger (1 binaire)                                 │
│  • Fonctionne derrière NAT avec Tailscale/WireGuard       │
│  • Auto-healing (redémarre les pods crashés)              │
│  • Load balancing intégré                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```bash
# Installer K3s sur un PC joueur (30 secondes)
curl -sfL https://get.k3s.io | sh -

# Rejoindre le cluster (sur un autre PC)
curl -sfL https://get.k3s.io | K3S_URL=https://master:6443 \
  K3S_TOKEN=xxx sh -

# Déployer le jeu
kubectl apply -f game-deployment.yaml
```

---

### Réseau overlay avec WireGuard/Tailscale

Le problème du NAT résolu élégamment :

```
┌─────────────────────────────────────────────────────────────┐
│                    RÉSEAU OVERLAY                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PROBLÈME : Les super-nœuds sont derrière des NAT         │
│                                                             │
│  Joueur A (192.168.1.x) ──► NAT ──► Internet               │
│  Joueur B (192.168.0.x) ──► NAT ──► Internet               │
│                                                             │
│  → Comment ils se connectent directement ?                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SOLUTION : Tailscale (basé sur WireGuard)                 │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │              RÉSEAU VIRTUEL TAILSCALE             │     │
│  │                                                    │     │
│  │   Joueur A          Joueur B          Joueur C    │     │
│  │   100.64.0.1       100.64.0.2        100.64.0.3  │     │
│  │       │                │                 │        │     │
│  │       └────────────────┼─────────────────┘        │     │
│  │                        │                          │     │
│  │              Connexion directe P2P               │     │
│  │              (WireGuard, chiffré)                │     │
│  │                                                    │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  • Tailscale traverse les NAT automatiquement              │
│  • Chiffrement WireGuard (rapide, moderne)                 │
│  • Latence minimale (P2P direct quand possible)            │
│  • Gratuit jusqu'à 100 appareils                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```bash
# Super-nœud rejoint le réseau
tailscale up --authkey=tskey-xxx

# Maintenant tous les super-nœuds se voient en 100.64.x.x
ping 100.64.0.2  # Latence ~5-15ms entre fibres
```

---

### Architecture complète "Cloud Maison"

```
┌─────────────────────────────────────────────────────────────┐
│              ARCHITECTURE CLOUD DÉCENTRALISÉ                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   COUCHE RÉSEAU                      │   │
│  │            Tailscale / WireGuard / Nebula            │   │
│  │         (VPN mesh auto-organisé, chiffré)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   COUCHE ORCHESTRATION               │   │
│  │                  K3s / Nomad / Docker Swarm          │   │
│  │         (déploiement, scaling, auto-healing)         │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   COUCHE CONSENSUS                   │   │
│  │                  Raft / etcd / Consul                │   │
│  │         (état partagé, élection de leader)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   COUCHE DONNÉES                     │   │
│  │              CockroachDB / TiKV / CRDT               │   │
│  │         (base de données distribuée)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   COUCHE JEU                         │   │
│  │              Game Server (Node.js/Rust)              │   │
│  │         (logique de jeu, validation)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Comparaison des technologies

| Besoin | Option légère | Option robuste | Notre choix |
|--------|---------------|----------------|-------------|
| **Réseau overlay** | WireGuard manuel | Tailscale | Tailscale (gratuit, simple) |
| **Orchestration** | Docker Compose | K3s | K3s (léger, puissant) |
| **Consensus** | Raft custom | etcd | Raft intégré à K3s |
| **Base distribuée** | Y.js CRDT | CockroachDB | Y.js (léger) → CockroachDB (scale) |
| **Service mesh** | Aucun | Linkerd/Istio | Optionnel (Phase 3) |

---

### Incitation à contribuer (économie)

Pour que les joueurs contribuent des ressources :

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME D'INCITATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONTRIBUTION                    RÉCOMPENSE                 │
│  ─────────────────────────────────────────────────────────  │
│  Super-nœud 24/7                 Badge "Pilier" + skin     │
│  Super-nœud occasionnel          Badge "Contributeur"      │
│  Bande passante élevée           Priorité de connexion     │
│  Héberger une salle              Nom personnalisé          │
│  Uptime > 95%                    Titre spécial             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  DASHBOARD CONTRIBUTEUR                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🖥️ Mon Super-Nœud                                 │   │
│  │                                                      │   │
│  │  Status: ✅ Actif                                   │   │
│  │  Uptime: 99.2% (ce mois)                            │   │
│  │  Joueurs servis: 1,234                              │   │
│  │  Bande passante: 2.3 TB                             │   │
│  │                                                      │   │
│  │  Récompenses gagnées:                               │   │
│  │  🏆 Badge Pilier                                    │   │
│  │  🎨 Skin exclusif "Héros du réseau"                 │   │
│  │  ⭐ Priorité de connexion                           │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Faisabilité technique

| Aspect | Difficulté | Notes |
|--------|------------|-------|
| **Tailscale setup** | ⭐ Facile | 1 commande, gratuit |
| **K3s sur PC gamer** | ⭐⭐ Moyen | Script d'installation |
| **Consensus Raft** | ⭐⭐ Moyen | Librairies existantes |
| **Auto-scaling** | ⭐⭐⭐ Avancé | Logique custom à écrire |
| **Migration de joueurs** | ⭐⭐⭐ Avancé | Seamless handoff complexe |

---

### Roadmap réaliste

```
PHASE 1 : MVP avec PeerJS ✅ (TERMINÉ)
├── [x] Full mesh P2P avec PeerJS
├── [x] Système de recettes JSON
├── [x] 10-15 joueurs simultanés
├── [x] Rendu 3D avec Three.js
├── [x] Physique basique + caméra third-person
├── [x] Interface utilisateur complète
└── [x] Rôle Super Architecte (admin)

PHASE 2 : Persistance et Robustesse 🔄 (EN COURS)
├── [ ] Implémentation IndexedDB local
├── [ ] Synchronisation différentielle (deltas)
├── [ ] Chunking spatial basique (16×16×16)
├── [ ] Validation par consensus simple
├── [ ] Support 20 joueurs simultanés
└── [ ] Gestion conflits par timestamp

PHASE 3 : Scalabilité (Optionnel)
├── [ ] Super-peers en PeerJS (pas Yjs)
├── [ ] Topologie hybride mesh/étoile
├── [ ] 50+ joueurs avec relais
└── [ ] Décision: Migrer vers Yjs SI nécessaire

PHASE 4 : Cloud Décentralisé (Vision)
├── [ ] K3s + Tailscale pour super-nodes
├── [ ] Auto-scaling dynamique
├── [ ] Système de récompenses contributeurs
└── [ ] 100+ joueurs avec sharding spatial
```

---

## 🔐 Gestion de la triche

### Approche "Trust but Verify"

Puisqu'il n'y a pas de serveur autoritaire, on utilise un système de **consensus** :

1. **Validation locale** : Chaque client valide les actions avant de les appliquer
2. **Règles partagées** : Les règles du jeu sont dans le code (même pour tous)
3. **Réputation** : Les pairs peuvent signaler des comportements suspects
4. **Rollback** : Possibilité de rejeter des modifications invalides

```javascript
// Exemple de validation
function validateBlockPlacement(playerId, position, blockType) {
  const player = players.get(playerId);
  const distance = player.position.distanceTo(position);
  
  // Un joueur ne peut pas placer un bloc à plus de 5 unités
  if (distance > 5) return false;
  
  // Vérifier que le joueur a le bloc dans son inventaire
  if (!player.inventory.has(blockType)) return false;
  
  return true;
}
```

---

## 📊 Métriques de performance cibles

| Métrique | Objectif |
|----------|----------|
| Latence affichage autres joueurs | < 100ms |
| Temps de sync initial | < 3s |
| Mémoire par chunk | < 100KB |
| Bande passante par joueur | < 50KB/s |
| Joueurs simultanés | 10-20 par salle |

---

## 🎯 Avantages de cette architecture

1. **Vraiment décentralisé** : Aucun serveur central requis
2. **Résilient** : Un joueur qui part n'affecte pas les autres
3. **Persistant** : Les modifications survivent aux déconnexions
4. **Performant** : Séparation des flux haute/basse fréquence
5. **Simple** : Basé sur des primitives éprouvées (Y.js, WebRTC)
6. **Scalable** : Le chunking permet de grandes maps
7. **Offline-first** : Jouable même sans connexion (mode solo)

---

## 🛠️ Technologies utilisées

| Besoin | Technologie | Version | Raison |
|--------|-------------|---------|--------|
| **Rendu 3D** | Three.js | r128 | Standard web, performant, bien documenté |
| **P2P Mesh** | PeerJS | 1.5.2 | Simple, WebRTC sans complexité |
| **Interface** | Tailwind CSS | 3.x (CDN) | Styling rapide, responsive |
| **Hébergement** | HTML standalone | - | Déployable partout (GitHub Pages, etc.) |
| **Persistance** | Mémoire (Map) | - | Phase 1, IndexedDB en Phase 2 |

### Pourquoi PeerJS plutôt que Yjs ?

**Avantages PeerJS pour ce projet** :
- ✅ API simple et intuitive (apprentissage rapide)
- ✅ Contrôle total sur les messages (debug facile)
- ✅ Bundle léger (~20KB vs ~100KB pour Yjs)
- ✅ Pas de "magie" CRDT cachée
- ✅ Parfait pour 10-20 joueurs en full mesh

**Quand envisager Yjs** :
- ⚠️ Si >50 joueurs simultanés
- ⚠️ Si conflits fréquents (>10% des actions)
- ⚠️ Si besoin offline-first complexe

**Décision actuelle** : PeerJS suffit largement. Migration vers Yjs uniquement si les données le justifient.

---

## 🌐 Architecture réseau détaillée

### Topologie du réseau P2P

```
┌─────────────────────────────────────────────────────────────┐
│                    TOPOLOGIE MESH                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chaque joueur est connecté à TOUS les autres              │
│                                                             │
│           Joueur A                                          │
│              ╱ ╲                                            │
│             ╱   ╲                                           │
│            ╱     ╲                                          │
│     Joueur B ──── Joueur C                                  │
│            ╲     ╱                                          │
│             ╲   ╱                                           │
│              ╲ ╱                                            │
│           Joueur D                                          │
│                                                             │
│  Connexions = N × (N-1) / 2                                │
│  4 joueurs = 6 connexions                                  │
│  10 joueurs = 45 connexions                                │
│  20 joueurs = 190 connexions ⚠️                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Limites du full mesh et solutions

| Joueurs | Connexions | Bande passante | Solution |
|---------|------------|----------------|----------|
| 2-10 | 1-45 | ✅ OK | Full mesh |
| 10-20 | 45-190 | ⚠️ Élevée | Mesh partiel |
| 20-50 | 190-1225 | ❌ Trop | Super-peers |
| 50+ | 1225+ | ❌❌ | Sharding en sous-salles |

### Architecture hybride pour la scalabilité

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER-PEERS (10+ joueurs)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Certains joueurs deviennent des "super-peers" :           │
│  - Bonne connexion (fibre, faible latence)                 │
│  - Volontaires ou élus automatiquement                     │
│                                                             │
│         ┌──────────────────────────────────────┐           │
│         │          SUPER-PEERS                  │           │
│         │    (full mesh entre eux)              │           │
│         │                                       │           │
│         │    SP1 ◄────────► SP2                │           │
│         │     ▲ ╲          ╱ ▲                 │           │
│         │     │  ╲        ╱  │                 │           │
│         │     │   ╲      ╱   │                 │           │
│         │     │    ╲    ╱    │                 │           │
│         └─────│─────╲──╱─────│─────────────────┘           │
│               │      ╲╱      │                              │
│               │      ╱╲      │                              │
│         ┌─────▼─────╱──╲─────▼─────────────────┐           │
│         │          ╱    ╲                       │           │
│         │    Joueurs normaux                    │           │
│         │    (connectés à 1-2 super-peers)      │           │
│         │                                       │           │
│         │    J1  J2  J3  J4  J5  J6  J7  J8    │           │
│         │                                       │           │
│         └───────────────────────────────────────┘           │
│                                                             │
│  Avantages:                                                │
│  - Moins de connexions par joueur                          │
│  - Les super-peers relaient les messages                   │
│  - Tolérance aux pannes (plusieurs super-peers)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Établissement des connexions WebRTC

```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESSUS DE CONNEXION                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ÉTAPE 1: Signaling (via serveur Y.js public)              │
│                                                             │
│  Joueur A                    Serveur Signaling              │
│     │                              │                        │
│     │─── JOIN room "ma-salle" ────►│                        │
│     │                              │                        │
│     │◄── Liste des peers ──────────│                        │
│     │    [Joueur B, Joueur C]      │                        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ÉTAPE 2: Échange ICE/SDP (WebRTC handshake)               │
│                                                             │
│  Joueur A                                        Joueur B   │
│     │                                               │       │
│     │─── OFFER (SDP) ────────────────────────────►│       │
│     │    via serveur signaling                     │       │
│     │                                               │       │
│     │◄── ANSWER (SDP) ─────────────────────────────│       │
│     │                                               │       │
│     │◄── ICE candidates ───────────────────────────│       │
│     │─── ICE candidates ──────────────────────────►│       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ÉTAPE 3: Connexion directe établie                        │
│                                                             │
│  Joueur A ◄══════════════════════════════════════► Joueur B │
│              DataChannel P2P (plus de serveur!)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### NAT Traversal (traversée de firewall)

```
┌─────────────────────────────────────────────────────────────┐
│                    PROBLÈME DU NAT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  La plupart des joueurs sont derrière un NAT/routeur       │
│  → Pas d'IP publique directe                               │
│  → Connexion P2P directe impossible sans aide              │
│                                                             │
│  ┌─────────────┐                      ┌─────────────┐      │
│  │  Joueur A   │                      │  Joueur B   │      │
│  │  192.168.x  │                      │  192.168.x  │      │
│  └──────┬──────┘                      └──────┬──────┘      │
│         │                                    │              │
│    ┌────▼────┐                          ┌────▼────┐        │
│    │ Routeur │                          │ Routeur │        │
│    │   NAT   │                          │   NAT   │        │
│    └────┬────┘                          └────┬────┘        │
│         │                                    │              │
│         └──────────── ??? ───────────────────┘              │
│                 Comment se connecter ?                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Solutions de traversée NAT

```
┌─────────────────────────────────────────────────────────────┐
│                    SOLUTIONS NAT TRAVERSAL                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. STUN (Session Traversal Utilities for NAT)             │
│     ─────────────────────────────────────────────          │
│     - Découvre l'IP publique du joueur                     │
│     - Gratuit, serveurs publics disponibles                │
│     - Fonctionne pour ~80% des cas                         │
│                                                             │
│  2. TURN (Traversal Using Relays around NAT)               │
│     ─────────────────────────────────────────────          │
│     - Serveur relais pour les cas difficiles               │
│     - Coûteux en bande passante (tout passe par le relais) │
│     - Fallback quand STUN échoue                           │
│                                                             │
│  3. ICE (Interactive Connectivity Establishment)           │
│     ─────────────────────────────────────────────          │
│     - Combine STUN + TURN                                  │
│     - Essaie la meilleure option automatiquement           │
│     - Utilisé par WebRTC                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Configuration ICE

```javascript
// Configuration WebRTC avec STUN/TURN
const iceServers = [
  // Serveurs STUN gratuits (Google)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  
  // Serveurs STUN alternatifs
  { urls: 'stun:stun.stunprotocol.org:3478' },
  
  // Serveur TURN (fallback) - nécessite un compte
  // Option 1: Service payant (Twilio, Xirsys)
  {
    urls: 'turn:turn.example.com:3478',
    username: 'user',
    credential: 'password'
  },
  
  // Option 2: Serveur TURN auto-hébergé (coturn)
  {
    urls: 'turn:turn.notre-jeu.com:3478',
    username: 'gameuser',
    credential: 'secret'
  }
];

// Y.js avec configuration ICE personnalisée
const provider = new WebrtcProvider(roomName, ydoc, {
  signaling: ['wss://signaling.yjs.dev'],
  // Passer la config ICE
  peerOpts: {
    config: {
      iceServers: iceServers
    }
  }
});
```

---

### Canaux de communication (DataChannels)

```
┌─────────────────────────────────────────────────────────────┐
│                    DATACHANNELS WEBRTC                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WebRTC permet plusieurs canaux par connexion :            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  CONNEXION P2P                       │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │ POSITIONS    │  │ MONDE (CRDT) │  │ CHAT      │ │   │
│  │  │              │  │              │  │           │ │   │
│  │  │ unreliable   │  │ reliable     │  │ reliable  │ │   │
│  │  │ unordered    │  │ ordered      │  │ ordered   │ │   │
│  │  │ 60 Hz        │  │ événementiel │  │ événement │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implémentation multi-canaux

```javascript
// Canal pour les positions (haute fréquence, perte acceptable)
const positionChannel = peer.createDataChannel('positions', {
  ordered: false,      // Pas besoin d'ordre
  maxRetransmits: 0    // Pas de retransmission (comme UDP)
});

// Canal pour le monde (fiable, ordonné)
const worldChannel = peer.createDataChannel('world', {
  ordered: true,       // Ordre garanti
  reliable: true       // Retransmission si perte
});

// Canal pour le chat
const chatChannel = peer.createDataChannel('chat', {
  ordered: true,
  reliable: true
});

// Envoi de position (60 Hz)
function sendPosition() {
  if (positionChannel.readyState === 'open') {
    positionChannel.send(JSON.stringify({
      type: 'POS',
      id: myPlayerId,
      p: [player.position.x, player.position.y, player.position.z],
      r: [player.rotation.x, player.rotation.y, player.rotation.z],
      t: Date.now()
    }));
  }
}

// Envoi d'une modification du monde (événementiel)
function sendWorldChange(change) {
  if (worldChannel.readyState === 'open') {
    worldChannel.send(JSON.stringify({
      type: 'WORLD',
      action: 'PLACE_BLOCK',
      data: change,
      sig: signature
    }));
  }
}
```

---

### Gestion de la bande passante

```
┌─────────────────────────────────────────────────────────────┐
│                    BUDGET BANDE PASSANTE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Objectif: < 50 KB/s par joueur (upload + download)        │
│                                                             │
│  UPLOAD (ce que j'envoie)                                  │
│  ─────────────────────────────────────────────────────────  │
│  Ma position      : 60 Hz × 50 bytes = 3 KB/s              │
│  × N-1 joueurs    : 3 KB/s × 9 = 27 KB/s (10 joueurs)      │
│  Modifications    : ~0.5 KB/s (moyenne)                    │
│  Chat             : ~0.1 KB/s (moyenne)                    │
│  Heartbeat        : 0.5 Hz × 100 bytes = 0.05 KB/s         │
│  ─────────────────────────────────────────────────────────  │
│  TOTAL UPLOAD     : ~28 KB/s pour 10 joueurs               │
│                                                             │
│  DOWNLOAD (ce que je reçois)                               │
│  ─────────────────────────────────────────────────────────  │
│  Positions autres : 3 KB/s × 9 = 27 KB/s                   │
│  Modifications    : ~0.5 KB/s                              │
│  Chat             : ~0.1 KB/s                              │
│  ─────────────────────────────────────────────────────────  │
│  TOTAL DOWNLOAD   : ~28 KB/s pour 10 joueurs               │
│                                                             │
│  ⚠️ Avec 20 joueurs: ~57 KB/s (limite acceptable)         │
│  ❌ Avec 50 joueurs: ~150 KB/s (trop pour certains)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Optimisations de bande passante

```javascript
// 1. COMPRESSION DES POSITIONS
// Avant: { x: 123.456789, y: 45.123456, z: 78.901234 }
// Après: [1235, 451, 789] (integers × 10, économise 70%)

function compressPosition(pos) {
  return [
    Math.round(pos.x * 10),
    Math.round(pos.y * 10),
    Math.round(pos.z * 10)
  ];
}

function decompressPosition(arr) {
  return {
    x: arr[0] / 10,
    y: arr[1] / 10,
    z: arr[2] / 10
  };
}

// 2. DELTA ENCODING (envoyer uniquement les changements)
let lastSentPosition = null;

function shouldSendPosition(newPos) {
  if (!lastSentPosition) return true;
  
  const dx = Math.abs(newPos.x - lastSentPosition.x);
  const dy = Math.abs(newPos.y - lastSentPosition.y);
  const dz = Math.abs(newPos.z - lastSentPosition.z);
  
  // Envoyer seulement si déplacement > 0.1 unité
  return dx > 0.1 || dy > 0.1 || dz > 0.1;
}

// 3. ADAPTIVE RATE (réduire la fréquence si bande passante limitée)
let sendRate = 60; // Hz

function adaptSendRate(rtt, packetLoss) {
  if (packetLoss > 0.1 || rtt > 200) {
    sendRate = Math.max(20, sendRate - 10); // Réduire
  } else if (packetLoss < 0.01 && rtt < 50) {
    sendRate = Math.min(60, sendRate + 5); // Augmenter
  }
}

// 4. BINARY PROTOCOL (au lieu de JSON)
// MessagePack ou Protocol Buffers pour réduire la taille

import { encode, decode } from '@msgpack/msgpack';

function sendPositionBinary() {
  const data = encode({
    t: 'P', // type
    i: myPlayerId.slice(0, 8), // ID court
    p: compressPosition(player.position),
    r: compressRotation(player.rotation)
  });
  // ~20 bytes au lieu de ~100 bytes JSON
  positionChannel.send(data);
}
```

---

### Synchronisation temporelle

```
┌─────────────────────────────────────────────────────────────┐
│                    HORLOGE DISTRIBUÉE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Problème: Les horloges des joueurs ne sont pas sync       │
│                                                             │
│  Joueur A: 14:00:00.000                                    │
│  Joueur B: 14:00:00.350 (+350ms de décalage)               │
│  Joueur C: 13:59:59.800 (-200ms de décalage)               │
│                                                             │
│  → Qui a placé le bloc en premier ?                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Solution: Horloge logique (Lamport)

```javascript
// Horloge de Lamport - ordre causal des événements
let logicalClock = 0;

function tick() {
  return ++logicalClock;
}

function onReceive(message) {
  // Mettre à jour l'horloge locale
  logicalClock = Math.max(logicalClock, message.timestamp) + 1;
  return logicalClock;
}

function createAction(type, data) {
  return {
    type,
    data,
    timestamp: tick(),
    playerId: myPlayerId,
    // Pour départager les égalités
    tiebreaker: crypto.randomUUID()
  };
}

// Comparaison d'actions pour l'ordre
function compareActions(a, b) {
  if (a.timestamp !== b.timestamp) {
    return a.timestamp - b.timestamp;
  }
  // Même timestamp logique → utiliser l'ID comme tiebreaker
  return a.tiebreaker.localeCompare(b.tiebreaker);
}
```

#### Solution: Estimation du décalage (NTP simplifié)

```javascript
// Estimer le décalage d'horloge avec chaque pair
const clockOffsets = new Map(); // peerId -> offset en ms

async function syncClockWith(peer) {
  const t1 = Date.now();
  
  // Envoyer ping
  peer.send({ type: 'CLOCK_SYNC', t1 });
  
  // Attendre pong
  const response = await waitForResponse(peer, 'CLOCK_SYNC_RESPONSE');
  const t4 = Date.now();
  
  const t2 = response.t2; // Timestamp du peer à réception
  const t3 = response.t3; // Timestamp du peer à envoi
  
  // Calcul NTP simplifié
  const roundTrip = (t4 - t1) - (t3 - t2);
  const offset = ((t2 - t1) + (t3 - t4)) / 2;
  
  clockOffsets.set(peer.id, offset);
  
  console.log(`Clock offset with ${peer.id}: ${offset}ms`);
}

// Convertir un timestamp reçu en temps local
function toLocalTime(timestamp, peerId) {
  const offset = clockOffsets.get(peerId) || 0;
  return timestamp - offset;
}
```

---

### Tolérance aux pannes

```
┌─────────────────────────────────────────────────────────────┐
│                    SCÉNARIOS DE PANNE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. UN JOUEUR SE DÉCONNECTE                                │
│     → Les autres continuent sans lui                       │
│     → Ses données restent (CRDT synchronisé)               │
│     → Il peut revenir et resync                            │
│                                                             │
│  2. PARTITION RÉSEAU (groupe A ne voit plus groupe B)      │
│     → Chaque groupe continue indépendamment                │
│     → À la reconnexion: fusion CRDT automatique            │
│     → Conflits résolus par timestamp/playerId              │
│                                                             │
│  3. PERTE DE PAQUETS                                       │
│     → Positions: ignorées (prochaine arrive vite)          │
│     → Monde: retransmission automatique (reliable)         │
│                                                             │
│  4. LATENCE ÉLEVÉE (lag)                                   │
│     → Interpolation lisse les mouvements                   │
│     → Buffer de 50-100ms pour absorber les variations      │
│                                                             │
│  5. TOUS LES JOUEURS PARTENT                               │
│     → Monde sauvé localement (IndexedDB)                   │
│     → Premier à revenir "réveille" le monde                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Détection et gestion des déconnexions

```javascript
// Heartbeat pour détecter les déconnexions
const HEARTBEAT_INTERVAL = 2000; // 2 secondes
const TIMEOUT = 10000; // 10 secondes sans heartbeat = déconnecté

const lastSeen = new Map(); // peerId -> timestamp

// Envoyer heartbeat
setInterval(() => {
  broadcast({
    type: 'HEARTBEAT',
    playerId: myPlayerId,
    timestamp: Date.now()
  });
}, HEARTBEAT_INTERVAL);

// Recevoir heartbeat
function onHeartbeat(peerId, timestamp) {
  lastSeen.set(peerId, Date.now());
}

// Vérifier les timeouts
setInterval(() => {
  const now = Date.now();
  
  for (const [peerId, lastTime] of lastSeen) {
    if (now - lastTime > TIMEOUT) {
      console.log(`Player ${peerId} timed out`);
      handleDisconnection(peerId);
      lastSeen.delete(peerId);
    }
  }
}, HEARTBEAT_INTERVAL);

// Gérer une déconnexion
function handleDisconnection(peerId) {
  // Marquer comme offline dans le CRDT
  const player = yPlayers.get(peerId);
  if (player) {
    player.set('status', 'offline');
    player.set('lastSeen', Date.now());
  }
  
  // Supprimer de l'affichage local
  removePlayerFromScene(peerId);
  
  // Notifier l'UI
  showNotification(`${player.get('name')} s'est déconnecté`);
}
```

---

### Protocole de messages

```
┌─────────────────────────────────────────────────────────────┐
│                    FORMAT DES MESSAGES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HEADER (commun à tous les messages)                       │
│  ─────────────────────────────────────────────────────────  │
│  {                                                          │
│    "v": 1,              // Version du protocole            │
│    "ts": 1702912345678, // Timestamp                       │
│    "id": "abc123"       // ID du joueur                    │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Répartition de la charge (Load Distribution)

### Principe fondamental : PAS de serveur central

```
┌─────────────────────────────────────────────────────────────┐
│              ARCHITECTURE CLASSIQUE (centralisée)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────┐                         │
│                    │   SERVEUR   │                         │
│                    │             │                         │
│                    │  100% de    │                         │
│                    │  la charge  │                         │
│                    └──────┬──────┘                         │
│           ┌───────────────┼───────────────┐                │
│           │               │               │                │
│           ▼               ▼               ▼                │
│        Joueur A       Joueur B       Joueur C              │
│        (client)       (client)       (client)              │
│                                                             │
│  ❌ Serveur = Point unique de défaillance                  │
│  ❌ Serveur = Coût (hébergement, maintenance)              │
│  ❌ Serveur = Goulot d'étranglement                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              NOTRE ARCHITECTURE (décentralisée)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        Joueur A ◄────────────────► Joueur B                │
│           ▲ ╲                      ╱ ▲                     │
│           │  ╲                    ╱  │                     │
│           │   ╲                  ╱   │                     │
│           │    ╲                ╱    │                     │
│           ▼     ╲              ╱     ▼                     │
│        Joueur D ◄─────────────► Joueur C                   │
│                                                             │
│  ✅ Chaque joueur = 25% de la charge (4 joueurs)           │
│  ✅ Pas de point unique de défaillance                     │
│  ✅ Coût = 0€ (pas de serveur)                             │
│  ✅ Plus de joueurs = Plus de capacité !                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Qui fait quoi ?

```
┌─────────────────────────────────────────────────────────────┐
│                RÉPARTITION DES RESPONSABILITÉS              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CHAQUE JOUEUR fait :                                      │
│  ─────────────────────────────────────────────────────────  │
│  ✅ Stocke une copie du monde (IndexedDB)                  │
│  ✅ Envoie sa position à tous les autres                   │
│  ✅ Reçoit les positions de tous les autres                │
│  ✅ Valide les actions reçues                              │
│  ✅ Fusionne les modifications (CRDT)                      │
│  ✅ Fait le rendu 3D (Three.js)                            │
│                                                             │
│  AUCUN SERVEUR ne fait :                                   │
│  ─────────────────────────────────────────────────────────  │
│  ❌ Stocker l'état du monde (réparti chez les joueurs)     │
│  ❌ Relayer les messages (direct P2P)                      │
│  ❌ Valider les actions (fait par les pairs)               │
│  ❌ Gérer les comptes (cryptographie locale)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Charge réseau par joueur

```
┌─────────────────────────────────────────────────────────────┐
│              CHARGE RÉSEAU PAR JOUEUR                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Formule : Charge = O(N) où N = nombre de joueurs          │
│                                                             │
│  ┌─────────┬─────────────┬─────────────┬────────────────┐  │
│  │ Joueurs │ Upload/j    │ Download/j  │ Total/joueur   │  │
│  ├─────────┼─────────────┼─────────────┼────────────────┤  │
│  │ 2       │ 3 KB/s      │ 3 KB/s      │ 6 KB/s         │  │
│  │ 5       │ 12 KB/s     │ 12 KB/s     │ 24 KB/s        │  │
│  │ 10      │ 27 KB/s     │ 27 KB/s     │ 54 KB/s        │  │
│  │ 20      │ 57 KB/s     │ 57 KB/s     │ 114 KB/s       │  │
│  │ 50      │ 147 KB/s    │ 147 KB/s    │ 294 KB/s ⚠️    │  │
│  └─────────┴─────────────┴─────────────┴────────────────┘  │
│                                                             │
│  ⚠️ Au-delà de 20 joueurs, optimisations nécessaires       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Comparaison des modèles

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPARAISON DES CHARGES                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SERVEUR CENTRALISÉ (ex: Minecraft)                        │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│     10 joueurs:                                            │
│     ┌────────────────────────────────────────────┐         │
│     │ Serveur : ████████████████████████ 100%    │         │
│     │ Joueur  : ██ ~10%                          │         │
│     └────────────────────────────────────────────┘         │
│                                                             │
│     Le serveur fait TOUT :                                 │
│     - Reçoit 10 × positions = 30 KB/s download             │
│     - Renvoie à chacun 9 positions = 270 KB/s upload       │
│     - Stocke le monde                                      │
│     - Valide les actions                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  P2P DÉCENTRALISÉ (notre architecture)                     │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│     10 joueurs:                                            │
│     ┌────────────────────────────────────────────┐         │
│     │ Joueur 1 : ██████████ 10%                  │         │
│     │ Joueur 2 : ██████████ 10%                  │         │
│     │ Joueur 3 : ██████████ 10%                  │         │
│     │ ...                                        │         │
│     │ Joueur 10: ██████████ 10%                  │         │
│     └────────────────────────────────────────────┘         │
│                                                             │
│     Chaque joueur fait SA part :                           │
│     - Upload: 27 KB/s (vers 9 autres)                      │
│     - Download: 27 KB/s (de 9 autres)                      │
│     - Stocke SA copie du monde                             │
│     - Valide les actions reçues                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Charge CPU/GPU

```
┌─────────────────────────────────────────────────────────────┐
│                    CHARGE CALCUL PAR JOUEUR                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CPU:                                                      │
│  ─────────────────────────────────────────────────────────  │
│  • Logique de jeu              : ~5%                       │
│  • Réseau (encode/decode)      : ~2%                       │
│  • CRDT (merge)                : ~1%                       │
│  • Crypto (signatures)         : ~1%                       │
│  • Collisions                  : ~3%                       │
│  ─────────────────────────────────────────────────────────  │
│  TOTAL CPU                     : ~12% (très léger)         │
│                                                             │
│  GPU:                                                      │
│  ─────────────────────────────────────────────────────────  │
│  • Rendu 3D Three.js           : Variable selon graphismes │
│  • Plus de chunks = plus de GPU                            │
│  • Optimisable (LOD, frustum culling)                      │
│                                                             │
│  MÉMOIRE (RAM):                                            │
│  ─────────────────────────────────────────────────────────  │
│  • État du monde (chunks)      : ~50-200 MB                │
│  • Y.js CRDT                   : ~10-50 MB                 │
│  • Three.js scene              : ~50-100 MB                │
│  • WebRTC buffers              : ~10 MB                    │
│  ─────────────────────────────────────────────────────────  │
│  TOTAL RAM                     : ~150-400 MB               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Super-peers : Partage intelligent de la charge

Pour les grandes salles (20+ joueurs), certains joueurs peuvent devenir des **super-peers** :

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE SUPER-PEERS                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ÉLECTION AUTOMATIQUE basée sur :                          │
│  • Bande passante disponible (test de débit)               │
│  • Latence faible                                          │
│  • Temps de jeu (stabilité)                                │
│  • Volontariat (opt-in)                                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  RÉPARTITION AVEC SUPER-PEERS (20 joueurs)                 │
│                                                             │
│     Sans super-peers:                                      │
│     ┌────────────────────────────────────────────┐         │
│     │ Chaque joueur : 57 KB/s × 2 = 114 KB/s     │         │
│     └────────────────────────────────────────────┘         │
│                                                             │
│     Avec 3 super-peers:                                    │
│     ┌────────────────────────────────────────────┐         │
│     │ Super-peer : ~200 KB/s (relais)            │         │
│     │ Joueur normal : ~30 KB/s                   │         │
│     └────────────────────────────────────────────┘         │
│                                                             │
│  Les super-peers relaient les messages pour                │
│  réduire le nombre de connexions directes                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```javascript
// Élection automatique des super-peers
async function electSuperPeers() {
  const candidates = [];
  
  for (const peer of connectedPeers) {
    const stats = await measurePeerStats(peer);
    candidates.push({
      peerId: peer.id,
      bandwidth: stats.bandwidth,    // KB/s disponible
      latency: stats.latency,        // ms
      uptime: stats.uptime,          // minutes connecté
      isVolunteer: stats.volunteer   // a accepté d'être super-peer
    });
  }
  
  // Score = bandwidth × 0.4 + (1/latency) × 0.3 + uptime × 0.2 + volunteer × 0.1
  candidates.sort((a, b) => calculateScore(b) - calculateScore(a));
  
  // Top 3 deviennent super-peers
  const superPeers = candidates.slice(0, 3);
  
  // Annoncer dans le CRDT
  ySuperPeers.set('current', superPeers.map(p => p.peerId));
  
  return superPeers;
}

// Décider si je dois relayer pour un joueur
function shouldRelayTo(targetPeerId) {
  const iAmSuperPeer = ySuperPeers.get('current').includes(myPlayerId);
  const targetZone = getPlayerZone(targetPeerId);
  const myZone = getPlayerZone(myPlayerId);
  
  // Super-peer relaie pour sa zone
  return iAmSuperPeer && targetZone === myZone;
}
```

---

### Avantages de la charge partagée

```
┌─────────────────────────────────────────────────────────────┐
│              AVANTAGES DE LA DÉCENTRALISATION               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💰 COÛT                                                   │
│  ─────────────────────────────────────────────────────────  │
│  Serveur classique : 50-500€/mois (selon joueurs)          │
│  P2P               : 0€ (les joueurs = l'infrastructure)   │
│                                                             │
│  📈 SCALABILITÉ                                            │
│  ─────────────────────────────────────────────────────────  │
│  Serveur classique : Plus de joueurs = serveur plus gros   │
│  P2P               : Plus de joueurs = plus de capacité !  │
│                                                             │
│  🔒 RÉSILIENCE                                             │
│  ─────────────────────────────────────────────────────────  │
│  Serveur classique : Serveur down = jeu down               │
│  P2P               : 1 joueur down = aucun impact          │
│                                                             │
│  🌍 LATENCE                                                │
│  ─────────────────────────────────────────────────────────  │
│  Serveur classique : Joueur → Serveur → Joueur (~100ms+)   │
│  P2P               : Joueur → Joueur direct (~30-50ms)     │
│                                                             │
│  🔓 CENSURE                                                │
│  ─────────────────────────────────────────────────────────  │
│  Serveur classique : L'éditeur peut tout contrôler         │
│  P2P               : Impossible à censurer ou fermer       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Ce qui reste "centralisé" (mais remplaçable)

```
┌─────────────────────────────────────────────────────────────┐
│           SERVICES ENCORE CENTRALISÉS (optionnels)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SERVICE            │ USAGE           │ ALTERNATIVES        │
│  ─────────────────────────────────────────────────────────  │
│  Serveur signaling  │ Première        │ Plusieurs serveurs  │
│  (Y.js public)      │ connexion       │ publics, ou DHT     │
│                     │                 │                     │
│  Serveurs STUN      │ Traversée NAT   │ Google, Mozilla,    │
│  (Google, etc.)     │                 │ auto-hébergé        │
│                     │                 │                     │
│  Serveur TURN       │ Fallback NAT    │ Optionnel, ou       │
│  (optionnel)        │ difficile       │ communautaire       │
│                     │                 │                     │
│  Serveur backup     │ Récupération    │ 100% optionnel      │
│  (optionnel)        │ de compte       │                     │
│                                                             │
│  ⚠️ Ces services sont :                                    │
│  • Interchangeables (pas de vendor lock-in)                │
│  • Réplicables (plusieurs disponibles)                     │
│  • Non-autoritaires (ne contrôlent pas le jeu)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Système d'identité et personnages

### Problématique

Dans un système décentralisé, **il n'y a pas de serveur central** pour :
- Vérifier qu'un joueur est bien qui il prétend être
- Empêcher deux connexions simultanées avec le même compte
- Gérer une base de données de comptes

### Solution : Identité cryptographique

```
┌─────────────────────────────────────────────────────────────┐
│                    IDENTITÉ JOUEUR                          │
├─────────────────────────────────────────────────────────────┤
│  ID Joueur = Hash de la clé publique (immuable)            │
│  Clé privée = Stockée localement (jamais transmise)        │
│  Signature = Preuve de propriété de l'identité             │
└─────────────────────────────────────────────────────────────┘
```

#### Génération de l'identité (première connexion)

```javascript
// Générer une paire de clés Ed25519 (ou ECDSA)
const keyPair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,  // extractable pour export
  ['sign', 'verify']
);

// L'ID du joueur = hash de sa clé publique
const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
const playerId = await sha256(publicKeyRaw); // Ex: "a3f8c2..."

// Stocker la clé privée localement (localStorage ou IndexedDB)
// JAMAIS transmise sur le réseau
```

#### Authentification P2P

Quand un joueur se connecte, il doit **prouver** qu'il possède la clé privée :

```
Joueur A veut rejoindre le réseau

1. A envoie: { publicKey, playerId, timestamp }
2. Pair B envoie un challenge: { nonce: "random123" }
3. A signe le challenge avec sa clé privée
4. A renvoie: { signature }
5. B vérifie la signature avec la clé publique de A
6. ✅ A est authentifié
```

### Structure Compte / Personnages

```
Account (identité cryptographique)
├── playerId: "a3f8c2..." (hash clé publique)
├── publicKey: Uint8Array
├── createdAt: timestamp
├── displayName: "MonPseudo" (modifiable)
└── characters: Map<characterId, Character>
    ├── char_001/
    │   ├── name: "Guerrier"
    │   ├── appearance: { ... }
    │   ├── inventory: Map
    │   ├── position: { x, y, z }
    │   ├── stats: { ... }
    │   └── lastPlayed: timestamp
    ├── char_002/
    │   ├── name: "Mage"
    │   └── ...
    └── ...
```

### 🚫 Empêcher les connexions simultanées (même ID)

C'est le **défi technique majeur** dans un système P2P.

#### Approche 1 : Consensus des pairs (recommandée)

```
┌──────────────────────────────────────────────────────────────┐
│                    DÉTECTION DOUBLON                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Session 1 (originale)          Session 2 (doublon)         │
│       │                              │                       │
│       │◄─── Heartbeat toutes les 2s ─┤                       │
│       │                              │                       │
│  ┌────▼────┐                    ┌────▼────┐                  │
│  │ Pair A  │                    │ Pair B  │                  │
│  └────┬────┘                    └────┬────┘                  │
│       │                              │                       │
│       └──────────► CONFLIT ◄─────────┘                       │
│                       │                                      │
│              ┌────────▼────────┐                             │
│              │ RÈGLE DE PRIORITÉ │                           │
│              │ Session la plus   │                           │
│              │ ancienne GAGNE    │                           │
│              └──────────────────┘                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Mécanisme détaillé

```javascript
// Chaque session a un "session token" unique signé
const sessionToken = {
  playerId: "a3f8c2...",
  sessionId: crypto.randomUUID(),
  startedAt: Date.now(),
  signature: signWithPrivateKey({ playerId, sessionId, startedAt })
};

// Heartbeat envoyé toutes les 2 secondes
broadcast({
  type: 'HEARTBEAT',
  playerId,
  sessionId,
  sessionStartedAt,
  timestamp: Date.now(),
  signature
});
```

#### Détection et résolution du conflit

```javascript
// Quand un pair reçoit un heartbeat
function onHeartbeat(data) {
  const existingSession = activeSessions.get(data.playerId);
  
  if (!existingSession) {
    // Nouveau joueur, OK
    activeSessions.set(data.playerId, data);
    return;
  }
  
  if (existingSession.sessionId === data.sessionId) {
    // Même session, mise à jour du timestamp
    existingSession.lastSeen = Date.now();
    return;
  }
  
  // ⚠️ CONFLIT : Deux sessions différentes pour le même joueur !
  console.warn(`Conflit détecté pour ${data.playerId}`);
  
  // Règle : La session la plus ANCIENNE gagne
  if (data.sessionStartedAt < existingSession.sessionStartedAt) {
    // La nouvelle session est en fait plus ancienne (on l'avait pas vue)
    // Notifier l'autre session qu'elle doit se déconnecter
    sendToSession(existingSession.sessionId, { type: 'FORCE_DISCONNECT' });
    activeSessions.set(data.playerId, data);
  } else {
    // La session entrante est plus récente, on lui dit de partir
    sendToSession(data.sessionId, { type: 'FORCE_DISCONNECT' });
  }
}
```

#### Approche 2 : Token de session dans le CRDT (alternative)

```javascript
// Le CRDT contient un champ "activeSession" par joueur
yPlayers.get(playerId).set('activeSession', {
  sessionId: mySessionId,
  startedAt: Date.now(),
  lastHeartbeat: Date.now()
});

// Observer les changements
yPlayers.observe((event) => {
  for (const [playerId, change] of event.changes.keys) {
    const session = yPlayers.get(playerId).get('activeSession');
    
    if (session.sessionId !== mySessionId && playerId === myPlayerId) {
      // Quelqu'un d'autre a pris notre place !
      if (session.startedAt < myStartedAt) {
        // Il était là avant, on doit partir
        forceDisconnect("Session dupliquée - déconnexion");
      }
    }
  }
});
```

### 🔒 Sécurité de l'identité

#### Menaces et contre-mesures

| Menace | Risque | Contre-mesure |
|--------|--------|---------------|
| Vol de clé privée | Usurpation d'identité | Clé stockée uniquement localement, jamais transmise |
| Replay attack | Rejouer d'anciennes signatures | Timestamp + nonce dans chaque signature |
| Création massive de comptes | Spam, griefing | Rate limiting par les pairs |
| Modification du code client | Triche | Validation côté pairs (consensus) |

#### Stockage sécurisé de la clé privée

```javascript
// Option 1 : IndexedDB (recommandé)
// La clé reste dans le navigateur, non extractable

// Option 2 : Export chiffré (pour backup/transfert)
async function exportIdentity(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: salt },
    key,
    privateKeyBytes
  );
  return { salt, encrypted }; // Sauvegarder dans un fichier
}
```

### 📱 Multi-appareils

Comment un joueur peut-il jouer sur plusieurs appareils ?

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSFERT D'IDENTITÉ                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Appareil 1 (original)           Appareil 2 (nouveau)      │
│       │                               │                     │
│  1. Exporter clé ─────────────────────►                     │
│     (QR code ou fichier chiffré)      │                     │
│                                       │                     │
│                          2. Importer clé                    │
│                                       │                     │
│  ⚠️ Les deux appareils ont           │                     │
│     la même identité                  │                     │
│                                       │                     │
│  3. Un seul peut être                 │                     │
│     connecté à la fois !              │                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Récupération de compte

### Problème fondamental

Dans un système décentralisé :
- **Pas de "mot de passe oublié"** → Pas de serveur pour le réinitialiser
- **Clé privée perdue = Compte perdu** → C'est la réalité de la crypto

### Le paradoxe de la récupération décentralisée

```
┌─────────────────────────────────────────────────────────────┐
│                    LE PARADOXE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Récupération classique:                                    │
│  "J'ai oublié mon mot de passe"                            │
│         │                                                   │
│         ▼                                                   │
│  Serveur central vérifie l'email                           │
│         │                                                   │
│         ▼                                                   │
│  Serveur réinitialise le mot de passe                      │
│                                                             │
│  ❌ IMPOSSIBLE sans serveur central !                       │
│                                                             │
│  ════════════════════════════════════════════════════════  │
│                                                             │
│  MAIS... il existe des alternatives décentralisées !       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Solutions de récupération décentralisées

### Solution 1 : Phrase mnémonique (Seed Phrase) — BASE

Inspirée des wallets crypto (Bitcoin, Ethereum), on génère une phrase de 12/24 mots qui encode la clé privée.

```
┌─────────────────────────────────────────────────────────────┐
│                    CRÉATION DU COMPTE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Génération aléatoire de 128 bits d'entropie            │
│                        │                                    │
│                        ▼                                    │
│  2. Conversion en phrase mnémonique (BIP39)                │
│     "apple banana cherry dragon elephant frog..."          │
│                        │                                    │
│                        ▼                                    │
│  3. Dérivation de la clé privée (PBKDF2/Argon2)           │
│                        │                                    │
│                        ▼                                    │
│  4. Génération de la clé publique                          │
│                        │                                    │
│                        ▼                                    │
│  5. Hash = Player ID                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Solution 2 : Social Recovery (Gardiens) — RECOMMANDÉE

Inspirée des smart contracts Argent et du protocole de Shamir. **Le joueur désigne des "gardiens" (amis de confiance)** qui peuvent collectivement restaurer l'accès.

```
┌─────────────────────────────────────────────────────────────┐
│                    SOCIAL RECOVERY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONFIGURATION (quand le compte est créé)                   │
│                                                             │
│  Joueur désigne 5 gardiens:                                │
│  ├── 👤 Alice (ami IRL)                                    │
│  ├── 👤 Bob (frère)                                        │
│  ├── 👤 Carol (ami de guilde)                              │
│  ├── 👤 Dave (collègue)                                    │
│  └── 👤 Eve (autre compte personnel)                       │
│                                                             │
│  Règle: 3 gardiens sur 5 peuvent restaurer                 │
│                                                             │
│  ════════════════════════════════════════════════════════  │
│                                                             │
│  RÉCUPÉRATION (quand le joueur perd sa clé)                │
│                                                             │
│  1. Joueur crée une NOUVELLE paire de clés                 │
│  2. Joueur contacte ses gardiens (hors jeu: Discord, etc.) │
│  3. Chaque gardien vote: "Oui, je confirme l'identité"     │
│  4. Quand 3/5 gardiens ont voté → Compte transféré         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implémentation technique

```javascript
// Structure de récupération stockée dans le CRDT
const recoveryConfig = {
  playerId: 'original_player_id',
  guardians: [
    { id: 'alice_id', publicKey: '...' },
    { id: 'bob_id', publicKey: '...' },
    { id: 'carol_id', publicKey: '...' },
    { id: 'dave_id', publicKey: '...' },
    { id: 'eve_id', publicKey: '...' }
  ],
  threshold: 3, // 3 sur 5 requis
  createdAt: Date.now(),
  signature: '...' // Signé par le propriétaire original
};

// Demande de récupération
const recoveryRequest = {
  type: 'RECOVERY_REQUEST',
  oldPlayerId: 'original_player_id',
  newPublicKey: '...', // Nouvelle clé du joueur
  requestedAt: Date.now(),
  votes: [] // Les gardiens vont voter ici
};

// Vote d'un gardien
async function voteForRecovery(requestId, approve) {
  const vote = {
    guardianId: myPlayerId,
    requestId,
    approve,
    timestamp: Date.now(),
    signature: await sign({ requestId, approve, timestamp }, myPrivateKey)
  };
  
  // Publier le vote dans le CRDT
  yRecoveryVotes.set(`${requestId}_${myPlayerId}`, vote);
}

// Vérification du consensus
function checkRecoveryComplete(requestId) {
  const request = yRecoveryRequests.get(requestId);
  const config = yRecoveryConfigs.get(request.oldPlayerId);
  
  const validVotes = request.votes.filter(vote => {
    // Vérifier que le votant est un gardien
    const isGuardian = config.guardians.some(g => g.id === vote.guardianId);
    // Vérifier la signature
    const validSig = verify(vote.signature, vote, getPublicKey(vote.guardianId));
    return isGuardian && validSig && vote.approve;
  });
  
  if (validVotes.length >= config.threshold) {
    // 🎉 Récupération approuvée !
    executeRecovery(request);
  }
}

// Exécution de la récupération
function executeRecovery(request) {
  // Transférer les données du compte vers la nouvelle clé
  const oldData = yPlayers.get(request.oldPlayerId);
  
  // Créer le nouveau joueur avec les anciennes données
  yPlayers.set(newPlayerId, {
    ...oldData,
    publicKey: request.newPublicKey,
    recoveredFrom: request.oldPlayerId,
    recoveredAt: Date.now()
  });
  
  // Marquer l'ancien compte comme "récupéré"
  yPlayers.get(request.oldPlayerId).set('status', 'recovered');
  yPlayers.get(request.oldPlayerId).set('recoveredTo', newPlayerId);
}
```

---

### Solution 3 : Shamir's Secret Sharing — AVANCÉE

Diviser la clé privée en N fragments. M fragments sont nécessaires pour la reconstruire.

```
┌─────────────────────────────────────────────────────────────┐
│                 SHAMIR'S SECRET SHARING                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Clé privée originale: "abc123secret..."                   │
│                                                             │
│  Divisée en 5 fragments (3 requis pour reconstruire):      │
│                                                             │
│  Fragment 1 → Alice (stocké chez elle)                     │
│  Fragment 2 → Bob (stocké chez lui)                        │
│  Fragment 3 → Serveur de backup (chiffré)                  │
│  Fragment 4 → Email perso (pièce jointe chiffrée)          │
│  Fragment 5 → Coffre-fort papier (imprimé)                 │
│                                                             │
│  ════════════════════════════════════════════════════════  │
│                                                             │
│  Pour récupérer: Combiner 3 fragments quelconques          │
│  Fragment 1 + Fragment 3 + Fragment 5 = Clé complète ✅    │
│                                                             │
│  Avec seulement 2 fragments = IMPOSSIBLE ❌                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```javascript
import { split, combine } from 'shamir-secret-sharing';

// Création des fragments
async function createRecoveryShares(privateKey, totalShares = 5, threshold = 3) {
  const shares = await split(privateKey, totalShares, threshold);
  
  return shares.map((share, i) => ({
    index: i + 1,
    data: share,
    // Chaque fragment peut être distribué différemment
  }));
}

// Récupération
async function recoverFromShares(shares) {
  if (shares.length < 3) {
    throw new Error('Need at least 3 shares');
  }
  
  const privateKey = await combine(shares);
  return privateKey;
}
```

---

### Solution 4 : Serveur de backup optionnel — HYBRIDE

Un serveur **non-autoritaire** qui stocke des backups **chiffrés** des clés. Le serveur ne peut PAS lire les clés.

```
┌─────────────────────────────────────────────────────────────┐
│               SERVEUR DE BACKUP (optionnel)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ Ce serveur est OPTIONNEL et NON-AUTORITAIRE            │
│     Il ne peut pas lire vos données, seulement les stocker │
│                                                             │
│  SAUVEGARDE:                                                │
│  1. Joueur chiffre sa clé avec un mot de passe fort        │
│  2. Joueur envoie la clé CHIFFRÉE au serveur               │
│  3. Serveur stocke: { hash(email): encrypted_key }         │
│                                                             │
│  RÉCUPÉRATION:                                              │
│  1. Joueur demande récupération avec son email             │
│  2. Serveur envoie un lien par email                       │
│  3. Joueur récupère sa clé CHIFFRÉE                        │
│  4. Joueur déchiffre avec son mot de passe                 │
│                                                             │
│  🔒 Le serveur ne connaît JAMAIS:                          │
│     - Le mot de passe                                       │
│     - La clé privée en clair                               │
│     - Le contenu des données                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```javascript
// Côté client: Sauvegarde
async function backupToServer(email, password) {
  // 1. Dériver une clé de chiffrement depuis le mot de passe
  const encryptionKey = await deriveKey(password, email); // email = salt
  
  // 2. Chiffrer la clé privée
  const encryptedPrivateKey = await encrypt(myPrivateKey, encryptionKey);
  
  // 3. Envoyer au serveur (le serveur ne peut pas déchiffrer)
  await fetch('https://backup.game.com/store', {
    method: 'POST',
    body: JSON.stringify({
      emailHash: await sha256(email), // Le serveur ne connaît pas l'email
      encryptedKey: encryptedPrivateKey,
      playerId: myPlayerId
    })
  });
}

// Côté client: Récupération
async function recoverFromServer(email, password) {
  // 1. Demander la clé chiffrée
  const response = await fetch('https://backup.game.com/recover', {
    method: 'POST',
    body: JSON.stringify({
      emailHash: await sha256(email)
    })
  });
  
  const { encryptedKey } = await response.json();
  
  // 2. Déchiffrer localement
  const encryptionKey = await deriveKey(password, email);
  const privateKey = await decrypt(encryptedKey, encryptionKey);
  
  return privateKey;
}
```

---

### Solution 5 : Questions de sécurité décentralisées

La clé est chiffrée avec les réponses aux questions, stockée dans le réseau P2P lui-même.

```
┌─────────────────────────────────────────────────────────────┐
│              QUESTIONS DE SÉCURITÉ P2P                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Configuration:                                             │
│  Q1: "Nom de votre premier animal ?"                       │
│  Q2: "Ville de naissance de votre mère ?"                  │
│  Q3: "Nom de votre meilleur ami d'enfance ?"               │
│                                                             │
│  Clé de chiffrement = hash(R1 + R2 + R3)                   │
│  Clé chiffrée stockée dans le CRDT public                  │
│                                                             │
│  ════════════════════════════════════════════════════════  │
│                                                             │
│  ⚠️ ATTENTION: Les questions de sécurité sont faibles      │
│     Préférer la phrase mnémonique ou le social recovery    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏆 Comparaison des solutions

| Solution | Décentralisation | Sécurité | UX | Recommandation |
|----------|------------------|----------|-----|----------------|
| **Phrase mnémonique** | ⭐⭐⭐ Totale | ⭐⭐⭐ Haute | ⭐⭐ Moyenne | ✅ BASE |
| **Social Recovery** | ⭐⭐⭐ Totale | ⭐⭐⭐ Haute | ⭐⭐⭐ Bonne | ✅ RECOMMANDÉE |
| **Shamir Shares** | ⭐⭐⭐ Totale | ⭐⭐⭐ Très haute | ⭐ Complexe | 🔧 Avancée |
| **Serveur backup** | ⭐⭐ Hybride | ⭐⭐ Moyenne | ⭐⭐⭐ Simple | ⚠️ Optionnel |
| **Questions sécu** | ⭐⭐⭐ Totale | ⭐ Faible | ⭐⭐⭐ Simple | ❌ Déconseillé |

---

## 🎯 Stratégie recommandée

Combiner plusieurs méthodes pour une sécurité maximale :

```
┌─────────────────────────────────────────────────────────────┐
│              STRATÉGIE DE RÉCUPÉRATION MULTI-NIVEAUX        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NIVEAU 1 - Phrase mnémonique (obligatoire)                │
│  └── 12 mots à noter sur papier                            │
│                                                             │
│  NIVEAU 2 - Social Recovery (recommandé)                   │
│  └── Désigner 3-5 gardiens de confiance                    │
│                                                             │
│  NIVEAU 3 - Backup serveur (optionnel)                     │
│  └── Pour ceux qui préfèrent un filet de sécurité          │
│                                                             │
│  Le joueur choisit son niveau de protection                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 Architecture alternative : Réseau P2P de serveurs (Consensus distribué)

### L'idée

> "Pourquoi ne pas avoir un réseau P2P de nœuds qui ensemble forment UNE source de vérité ?"

C'est exactement le principe des **blockchains** et des **bases de données distribuées** !

```
┌─────────────────────────────────────────────────────────────┐
│            RÉSEAU DE NŒUDS = UNE SOURCE DE VÉRITÉ           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────┐         ┌─────┐         ┌─────┐                │
│     │Nœud │◄───────►│Nœud │◄───────►│Nœud │                │
│     │  A  │         │  B  │         │  C  │                │
│     └──┬──┘         └──┬──┘         └──┬──┘                │
│        │               │               │                    │
│        └───────────────┼───────────────┘                    │
│                        │                                    │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │  ÉTAT CONSENSUS │                           │
│              │  (source unique)│                           │
│              └─────────────────┘                           │
│                                                             │
│  Chaque nœud a une copie, mais l'ÉTAT est unique           │
│  grâce au protocole de consensus                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Comparaison des approches

| Aspect | CRDT (Y.js actuel) | Consensus distribué | Serveur central |
|--------|-------------------|---------------------|-----------------|
| Source de vérité | Chaque client | Réseau de nœuds | Un serveur |
| Latence | ⚡ Instantané local | 🔄 ~100-500ms | 📡 Dépend du serveur |
| Résilience | ⭐⭐⭐ Très haute | ⭐⭐⭐ Haute | ⭐ Basse |
| Cohérence | Éventuelle | Forte | Forte |
| Complexité | Simple | Complexe | Simple |
| Coût | Gratuit | Nœuds à héberger | Serveur à payer |

---

### Option A : Kubernetes P2P avec algorithme de consensus

Chaque joueur (ou volontaire) peut faire tourner un **nœud validateur**.

```
┌─────────────────────────────────────────────────────────────┐
│                  ARCHITECTURE K8S P2P                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Joueur 1           Joueur 2           Joueur 3            │
│  (navigateur)       (navigateur)       (navigateur)        │
│      │                  │                  │                │
│      └──────────────────┼──────────────────┘                │
│                         │                                   │
│                         ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              RÉSEAU DE VALIDATEURS                    │  │
│  │                                                       │  │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐         │  │
│  │   │ Node 1  │    │ Node 2  │    │ Node 3  │         │  │
│  │   │ (K8s)   │◄──►│ (K8s)   │◄──►│ (K8s)   │         │  │
│  │   │ Paris   │    │ NYC     │    │ Tokyo   │         │  │
│  │   └─────────┘    └─────────┘    └─────────┘         │  │
│  │         │              │              │              │  │
│  │         └──────────────┼──────────────┘              │  │
│  │                        │                             │  │
│  │              ┌─────────▼─────────┐                   │  │
│  │              │  RAFT CONSENSUS   │                   │  │
│  │              │  Leader élu       │                   │  │
│  │              └───────────────────┘                   │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Les nœuds peuvent être hébergés par:                      │
│  - Les développeurs du jeu                                 │
│  - Des joueurs volontaires                                 │
│  - Des sponsors/communauté                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Algorithmes de consensus possibles

| Algorithme | Utilisé par | Avantages | Inconvénients |
|------------|-------------|-----------|---------------|
| **Raft** | etcd, Consul | Simple, rapide | Besoin de leader |
| **PBFT** | Hyperledger | Tolérant aux byzantins | Complexe, lent |
| **Tendermint** | Cosmos | Bon équilibre | Plus complexe |
| **HotStuff** | Diem (ex-Libra) | Très efficace | Nouveau, moins testé |

#### Implémentation avec Raft (recommandé)

```javascript
// Nœud validateur (serveur Node.js)
const { RaftNode } = require('raft-consensus');

const node = new RaftNode({
  id: process.env.NODE_ID,
  peers: [
    'wss://node1.game.com',
    'wss://node2.game.com', 
    'wss://node3.game.com'
  ],
  storage: new LevelDBStorage('./data'),
  
  // Callback quand une action est validée
  onCommit: (action) => {
    applyToWorldState(action);
    broadcastToClients(action);
  }
});

// API WebSocket pour les clients
wss.on('connection', (client) => {
  client.on('action', async (action) => {
    // Valider l'action
    if (!validateAction(action)) {
      return client.send({ error: 'Invalid action' });
    }
    
    // Proposer au consensus Raft
    const result = await node.propose(action);
    
    if (result.committed) {
      client.send({ success: true, sequence: result.index });
    }
  });
});
```

---

### Option B : Blockchain légère (sans crypto-monnaie)

Une blockchain privée/permissionnée pour le jeu, sans les aspects financiers.

```
┌─────────────────────────────────────────────────────────────┐
│                 BLOCKCHAIN DE JEU                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Block 1          Block 2          Block 3                 │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐            │
│  │ Genesis │──────│ Actions │──────│ Actions │────► ...   │
│  │         │      │ 1-100   │      │ 101-200 │            │
│  └─────────┘      └─────────┘      └─────────┘            │
│                                                             │
│  Chaque bloc contient:                                     │
│  - Hash du bloc précédent (chaîne immuable)               │
│  - Liste d'actions signées                                 │
│  - Timestamp                                                │
│  - Signatures des validateurs                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Avantages :**
- Historique complet et vérifiable
- Impossible de tricher (tout est tracé)
- Rollback possible en cas de bug

**Inconvénients :**
- Stockage croissant
- Latence de confirmation (~1-5 secondes)

---

### Option C : Hybrid - CRDT + Serveurs de validation

**Le meilleur des deux mondes :**

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE HYBRIDE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COUCHE RAPIDE (P2P direct, CRDT)                          │
│  ├── Positions des joueurs (60 Hz)                         │
│  ├── Chat                                                   │
│  └── Animations                                             │
│       │                                                     │
│       │ Instantané, pas de validation                       │
│       │                                                     │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  COUCHE VALIDÉE (Consensus)                                │
│  ├── Modifications du monde                                │
│  ├── Transactions (inventaire)                             │
│  ├── Réclamations de zones                                 │
│  └── Actions critiques                                      │
│       │                                                     │
│       │ Validé par le réseau de nœuds                      │
│       ▼                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│  │Validateur│◄──►│Validateur│◄──►│Validateur│              │
│  └─────────┘    └─────────┘    └─────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```javascript
// Client hybride
class HybridClient {
  constructor() {
    // Couche CRDT pour le temps réel
    this.ydoc = new Y.Doc();
    this.provider = new WebrtcProvider(room, this.ydoc);
    
    // Connexion aux validateurs pour les actions critiques
    this.validators = [
      new WebSocket('wss://validator1.game.com'),
      new WebSocket('wss://validator2.game.com'),
      new WebSocket('wss://validator3.game.com')
    ];
  }
  
  // Action rapide (mouvement) - P2P direct
  move(position) {
    this.yPlayers.get(this.playerId).set('position', position);
    // Pas de validation, instantané
  }
  
  // Action critique (construire) - Validée par consensus
  async placeBlock(position, blockType) {
    const action = {
      type: 'PLACE_BLOCK',
      position,
      blockType,
      playerId: this.playerId,
      timestamp: Date.now(),
      signature: await this.sign(...)
    };
    
    // Envoyer aux validateurs
    const responses = await Promise.all(
      this.validators.map(v => v.send(action))
    );
    
    // Attendre la confirmation (majorité)
    if (countConfirmed(responses) >= 2) {
      // Action validée, l'appliquer localement
      this.applyBlock(position, blockType);
    }
  }
}
```

---

### 🤔 Quel modèle choisir ?

| Critère | CRDT pur | Consensus distribué | Hybride |
|---------|----------|---------------------|---------|
| **Latence** | ⚡ 0ms | 🔄 100-500ms | ⚡/🔄 Selon action |
| **Anti-triche** | ⭐ Faible | ⭐⭐⭐ Fort | ⭐⭐⭐ Fort (actions critiques) |
| **Coût infra** | 💰 Gratuit | 💰💰💰 Serveurs | 💰💰 Quelques serveurs |
| **Complexité** | ⭐ Simple | ⭐⭐⭐ Complexe | ⭐⭐ Moyenne |
| **Offline** | ✅ Oui | ❌ Non | ✅ Partiel |

### Ma recommandation

Pour un **jeu décentralisé mais robuste** :

```
┌─────────────────────────────────────────────────────────────┐
│                 RECOMMANDATION FINALE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1 : CRDT pur (actuel)                               │
│  └── Développer le gameplay, tester avec des amis          │
│                                                             │
│  Phase 2 : Ajouter des validateurs optionnels              │
│  └── 3-5 nœuds hébergés par les devs/communauté           │
│  └── Valident les actions critiques                        │
│                                                             │
│  Phase 3 : Ouvrir aux validateurs communautaires           │
│  └── Joueurs peuvent faire tourner des nœuds              │
│  └── Récompenses optionnelles (cosmétiques, badges)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 🛠️ Technologies pour le consensus P2P

| Technologie | Type | Langage | Facilité |
|-------------|------|---------|----------|
| **libp2p** | Réseau P2P | JS/Go/Rust | ⭐⭐ |
| **OrbitDB** | DB décentralisée | JS | ⭐⭐⭐ |
| **GunDB** | DB P2P (déjà utilisé) | JS | ⭐⭐⭐ |
| **Tendermint** | Consensus BFT | Go | ⭐⭐ |
| **Raft (hashicorp)** | Consensus simple | Go | ⭐⭐ |

---

## 🛡️ Modèle de sécurité complet

### Système de modération décentralisé

Dans un jeu sans serveur central, la modération doit être **collective**. Voici le système proposé :

```
┌─────────────────────────────────────────────────────────────┐
│                 HIÉRARCHIE DE MODÉRATION                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👑 CRÉATEUR DE SALLE (Owner)                              │
│  │   - Pouvoir absolu sur SA salle                         │
│  │   - Peut nommer des GMs                                 │
│  │   - Peut ban instantané                                 │
│  │                                                          │
│  ├── 🛡️ GAME MASTERS (GMs)                                │
│  │   │   - Nommés par l'Owner                              │
│  │   │   - Peuvent kick/mute instantané                    │
│  │   │   - Ban temporaire (24h max)                        │
│  │   │   - Ban permanent = besoin de 2 GMs                 │
│  │   │                                                      │
│  │   └── 👥 JOUEURS                                        │
│  │       - Vote de bannissement collectif                   │
│  │       - Signalement de comportements                    │
│  │       - Réputation visible                              │
│  │                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Vote de bannissement par les joueurs

```
┌─────────────────────────────────────────────────────────────┐
│                    VOTE DE BANNISSEMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Un joueur initie un vote contre "Griefer123"           │
│     → Requiert au moins 2 signalements préalables          │
│                                                             │
│  2. Vote ouvert pendant 5 minutes                          │
│     ┌────────────────────────────────────┐                 │
│     │  Bannir Griefer123 ?               │                 │
│     │                                    │                 │
│     │  ✅ Pour: 7    ❌ Contre: 2         │                 │
│     │                                    │                 │
│     │  Temps restant: 3:42               │                 │
│     └────────────────────────────────────┘                 │
│                                                             │
│  3. Résultat                                               │
│     - Quorum: 50% des joueurs présents doivent voter       │
│     - Majorité: 66% pour bannir                            │
│     - Durée ban: Proportionnelle aux votes (1h - 7 jours)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implémentation

```javascript
// Structure d'un vote de bannissement
const banVote = {
  id: crypto.randomUUID(),
  type: 'BAN_VOTE',
  targetPlayerId: 'griefer123',
  initiatorId: 'player_abc',
  reason: 'Destruction massive de constructions',
  evidence: ['screenshot_url', 'action_log_hash'],
  createdAt: Date.now(),
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  votes: {
    for: [],     // Liste des playerIds
    against: []
  },
  status: 'active', // 'active' | 'passed' | 'rejected' | 'expired'
  signature: '...' // Signé par l'initiateur
};

// Stocker dans le CRDT
yModeration.set(banVote.id, banVote);

// Voter
function castBanVote(voteId, support) {
  const vote = yModeration.get(voteId);
  
  if (Date.now() > vote.expiresAt) {
    return { error: 'Vote expired' };
  }
  
  // Empêcher le double vote
  if (vote.votes.for.includes(myPlayerId) || 
      vote.votes.against.includes(myPlayerId)) {
    return { error: 'Already voted' };
  }
  
  // Enregistrer le vote signé
  const myVote = {
    playerId: myPlayerId,
    support,
    timestamp: Date.now(),
    signature: sign({ voteId, support, timestamp }, myPrivateKey)
  };
  
  if (support) {
    vote.votes.for.push(myPlayerId);
  } else {
    vote.votes.against.push(myPlayerId);
  }
  
  yModeration.set(voteId, vote);
  checkVoteResult(voteId);
}

// Vérifier le résultat
function checkVoteResult(voteId) {
  const vote = yModeration.get(voteId);
  const presentPlayers = getOnlinePlayers().length;
  const totalVotes = vote.votes.for.length + vote.votes.against.length;
  
  // Quorum atteint ?
  if (totalVotes < presentPlayers * 0.5) {
    return; // Pas assez de votes
  }
  
  // Majorité des 2/3 ?
  const forRatio = vote.votes.for.length / totalVotes;
  
  if (forRatio >= 0.66) {
    // Bannissement approuvé
    executeBan(vote.targetPlayerId, calculateBanDuration(forRatio));
    vote.status = 'passed';
  } else {
    vote.status = 'rejected';
  }
  
  yModeration.set(voteId, vote);
}

// Durée du ban basée sur le consensus
function calculateBanDuration(forRatio) {
  if (forRatio >= 0.90) return 7 * 24 * 60 * 60 * 1000;  // 7 jours
  if (forRatio >= 0.80) return 24 * 60 * 60 * 1000;      // 24 heures
  if (forRatio >= 0.66) return 60 * 60 * 1000;           // 1 heure
  return 0;
}
```

---

### Système de Game Masters (GM)

```
┌─────────────────────────────────────────────────────────────┐
│                    POUVOIRS DES GMs                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACTION          │ CONDITION           │ DURÉE MAX         │
│  ─────────────────────────────────────────────────────────  │
│  Mute            │ 1 GM                │ 1 heure           │
│  Kick            │ 1 GM                │ Instantané        │
│  Ban temporaire  │ 1 GM                │ 24 heures         │
│  Ban permanent   │ 2 GMs d'accord      │ Permanent*        │
│  Unban           │ Owner ou 2 GMs      │ -                 │
│                                                             │
│  * Permanent = jusqu'à unban                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implémentation des GMs

```javascript
// Structure des rôles dans une salle
const roomRoles = {
  roomId: 'ma-salle',
  owner: 'player_owner123',
  gameMasters: [
    { 
      playerId: 'gm_alice', 
      appointedBy: 'player_owner123',
      appointedAt: Date.now(),
      signature: '...'
    },
    { 
      playerId: 'gm_bob', 
      appointedBy: 'player_owner123',
      appointedAt: Date.now(),
      signature: '...'
    }
  ],
  signature: '...' // Signé par l'owner
};

// Action de modération par un GM
const moderationAction = {
  id: crypto.randomUUID(),
  type: 'GM_ACTION',
  action: 'BAN_TEMP', // 'MUTE' | 'KICK' | 'BAN_TEMP' | 'BAN_PERM' | 'UNBAN'
  targetPlayerId: 'griefer123',
  gmId: 'gm_alice',
  reason: 'Spam et insultes',
  duration: 24 * 60 * 60 * 1000, // 24h pour ban temp
  createdAt: Date.now(),
  signature: '...' // Signé par le GM
};

// Vérifier l'autorité d'un GM
function validateGMAction(action) {
  const roles = yRoles.get(currentRoomId);
  
  // Vérifier que c'est un GM
  const isGM = roles.gameMasters.some(gm => gm.playerId === action.gmId);
  const isOwner = roles.owner === action.gmId;
  
  if (!isGM && !isOwner) {
    return { valid: false, reason: 'Not a GM' };
  }
  
  // Vérifier la signature
  if (!verify(action.signature, action, getPublicKey(action.gmId))) {
    return { valid: false, reason: 'Invalid signature' };
  }
  
  // Ban permanent nécessite 2 GMs
  if (action.action === 'BAN_PERM') {
    const otherGMApproval = findGMApproval(action.targetPlayerId);
    if (!otherGMApproval && !isOwner) {
      return { valid: false, reason: 'Permanent ban requires 2 GMs or Owner' };
    }
  }
  
  return { valid: true };
}

// Appliquer un ban
function executeBan(playerId, duration) {
  const ban = {
    playerId,
    bannedAt: Date.now(),
    expiresAt: duration ? Date.now() + duration : null, // null = permanent
    bannedBy: 'vote' // ou 'gm_alice'
  };
  
  yBans.set(playerId, ban);
  
  // Notifier le joueur banni
  if (playerId === myPlayerId) {
    showBanScreen(ban);
    disconnect();
  }
  
  // Supprimer le joueur de la salle
  yPlayers.delete(playerId);
}

// Vérifier si un joueur est banni à la connexion
function checkBanned(playerId) {
  const ban = yBans.get(playerId);
  
  if (!ban) return false;
  
  // Ban expiré ?
  if (ban.expiresAt && Date.now() > ban.expiresAt) {
    yBans.delete(playerId);
    return false;
  }
  
  return true;
}
```

---

### Système de réputation

La réputation aide à identifier les joueurs problématiques :

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE RÉPUTATION                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SCORE DE RÉPUTATION (0 - 1000, défaut: 500)               │
│                                                             │
│  📈 GAINS                    📉 PERTES                      │
│  ─────────────────────────────────────────────────────────  │
│  +1  par heure de jeu       -50  signalement confirmé      │
│  +5  construction           -100 kick par GM               │
│  +10 aide un nouveau        -200 ban temporaire            │
│  +20 élu GM                 -500 ban permanent (si unban)  │
│                                                             │
│  NIVEAUX                                                   │
│  ─────────────────────────────────────────────────────────  │
│  🌟 800+ : Joueur de confiance (vote compte x2)            │
│  ✅ 500-799 : Normal                                       │
│  ⚠️ 200-499 : Surveillé (ne peut pas initier de vote)     │
│  🚫 0-199 : Restreint (ne peut pas construire)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```javascript
// Réputation stockée dans le CRDT (globale, pas par salle)
const reputation = {
  playerId: 'player_abc',
  score: 500,
  history: [
    { type: 'PLAY_TIME', delta: +1, timestamp: Date.now() },
    { type: 'GM_KICK', delta: -100, timestamp: Date.now() },
    // ...
  ],
  lastUpdated: Date.now()
};

// La réputation est signée par ceux qui la modifient
// et vérifiable par tous
```

---

### Appel et contestation

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME D'APPEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Un joueur banni peut faire appel :                        │
│                                                             │
│  1. Soumettre une demande d'appel (texte + preuves)        │
│  2. L'Owner ou 2 GMs examinent                             │
│  3. Vote de la communauté si pas de décision GM            │
│                                                             │
│  Délai : 24h minimum avant de pouvoir faire appel          │
│  Limite : 1 appel par ban                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Résumé des seuils

| Action | Qui peut | Condition | Durée |
|--------|----------|-----------|-------|
| **Signaler** | Tout joueur | - | - |
| **Initier vote ban** | Joueur (rep > 200) | 2 signalements | - |
| **Voter** | Tout joueur | Présent | 5 min |
| **Mute** | GM | - | 1h max |
| **Kick** | GM | - | Immédiat |
| **Ban temp** | GM | - | 24h max |
| **Ban perm** | 2 GMs ou Owner | - | Permanent |
| **Unban** | Owner ou 2 GMs | - | - |

---

### Types de salles

```
┌─────────────────────────────────────────────────────────────┐
│                    TYPES DE SALLES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 PUBLIQUE (défaut)                                       │
│     - Tout le monde peut rejoindre                          │
│     - Tout le monde peut modifier                           │
│     - Pas de modération                                     │
│                                                             │
│  🔒 PRIVÉE (hash secret)                                    │
│     - URL avec hash: game.com#ma-salle-secrete-xyz          │
│     - Seuls ceux qui ont l'URL peuvent rejoindre            │
│     - Tout le monde peut modifier                           │
│                                                             │
│  👑 MODÉRÉE (owner)                                         │
│     - Créateur = Owner                                      │
│     - Owner peut: kick, ban, définir des zones protégées    │
│     - Whitelist/Blacklist de joueurs                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Zones protégées

```javascript
// Définition d'une zone protégée
const protectedZone = {
  id: 'zone_001',
  bounds: {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 100, y: 50, z: 100 }
  },
  owner: 'player_abc123',
  permissions: {
    // Qui peut modifier dans cette zone
    canBuild: ['player_abc123', 'player_def456'],
    canDestroy: ['player_abc123'],
    // Ou par groupe
    groups: {
      'friends': ['player_def456', 'player_ghi789'],
      'visitors': [] // Lecture seule
    }
  },
  createdAt: Date.now(),
  signature: '...' // Signé par le owner
};

// Validation avant modification
function canModifyBlock(playerId, position, action) {
  const zone = findZoneContaining(position);
  
  if (!zone) {
    // Pas de zone = tout le monde peut modifier
    return true;
  }
  
  if (action === 'build') {
    return zone.permissions.canBuild.includes(playerId);
  }
  
  if (action === 'destroy') {
    return zone.permissions.canDestroy.includes(playerId);
  }
  
  return false;
}
```

---

## 💾 Persistance et synchronisation des personnages

### Où sont stockées les données ?

```
┌─────────────────────────────────────────────────────────────┐
│                STOCKAGE DES DONNÉES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DONNÉES LOCALES (IndexedDB du joueur)                      │
│  ├── Clé privée (jamais synchronisée)                       │
│  ├── Paramètres locaux (graphismes, son)                    │
│  └── Cache du monde visité                                  │
│                                                             │
│  DONNÉES SYNCHRONISÉES (CRDT partagé)                       │
│  ├── État du monde (blocs, constructions)                   │
│  ├── Données publiques des joueurs                          │
│  │   ├── Pseudo                                             │
│  │   ├── Apparence du personnage                            │
│  │   └── Position actuelle                                  │
│  └── Historique des actions (optionnel)                     │
│                                                             │
│  DONNÉES PERSONNAGES (CRDT + chiffré)                       │
│  ├── Inventaire (chiffré, seul le joueur peut lire)         │
│  ├── Stats du personnage                                    │
│  └── Progression                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Chiffrement des données privées

Les données sensibles (inventaire, etc.) sont stockées dans le CRDT mais chiffrées avec la clé du joueur :

```javascript
// Sauvegarder l'inventaire (chiffré)
async function saveInventory(inventory) {
  const plaintext = JSON.stringify(inventory);
  
  // Chiffrer avec la clé dérivée du compte
  const encrypted = await encrypt(plaintext, myDerivedKey);
  
  // Stocker dans le CRDT (les autres ne peuvent pas lire)
  yPlayers.get(myPlayerId).set('encryptedInventory', encrypted);
}

// Seul le propriétaire peut déchiffrer
async function loadInventory() {
  const encrypted = yPlayers.get(myPlayerId).get('encryptedInventory');
  const plaintext = await decrypt(encrypted, myDerivedKey);
  return JSON.parse(plaintext);
}
```

### Synchronisation multi-salle

Un personnage peut voyager entre salles :

```javascript
// Quitter une salle
async function leaveRoom() {
  // 1. Sauvegarder l'état du personnage localement
  await saveCharacterLocal(currentCharacter);
  
  // 2. Marquer comme "parti" dans le CRDT
  yPlayers.get(myPlayerId).set('status', 'offline');
  yPlayers.get(myPlayerId).set('lastSeen', Date.now());
  
  // 3. Déconnecter du provider WebRTC
  provider.disconnect();
}

// Rejoindre une nouvelle salle
async function joinRoom(roomName) {
  // 1. Charger le personnage depuis le stockage local
  const character = await loadCharacterLocal(selectedCharacterId);
  
  // 2. Se connecter à la nouvelle salle
  const provider = new WebrtcProvider(roomName, ydoc);
  
  // 3. Publier sa présence
  yPlayers.set(myPlayerId, {
    status: 'online',
    character: character.publicData,
    position: character.lastPosition || spawnPoint,
    joinedAt: Date.now()
  });
}
```

---

## ⚠️ Difficultés techniques identifiées

### 1. Synchronisation initiale lente

**Problème** : Premier joueur à rejoindre une salle existante doit télécharger tout l'état.

**Solutions** :
- Chunking : charger uniquement les chunks proches
- Compression : gzip des données CRDT
- Snapshot : sauvegarder des "photos" périodiques du monde

### 2. Divergence temporaire

**Problème** : Deux joueurs isolés modifient le même bloc.

**Solution** : CRDT avec règle déterministe (timestamp + playerId comme tie-breaker)

```javascript
// Règle : En cas de conflit, le timestamp le plus récent gagne
// Si même timestamp, l'ID joueur le plus grand (ordre alphabétique) gagne
function resolveConflict(change1, change2) {
  if (change1.timestamp !== change2.timestamp) {
    return change1.timestamp > change2.timestamp ? change1 : change2;
  }
  return change1.playerId > change2.playerId ? change1 : change2;
}
```

### 3. Joueurs malveillants

**Problème** : Un joueur envoie des données invalides ou spam.

**Solutions** :
- Validation des données avant application
- Rate limiting par joueur
- Système de réputation/bannissement par consensus

### 4. Latence variable

**Problème** : Certains joueurs ont une connexion lente.

**Solutions** :
- Interpolation et prédiction côté client
- Buffer de positions (afficher avec 50-100ms de retard)
- Indicateur de qualité de connexion

### 5. Perte de données si tous les joueurs partent

**Problème** : Si tous les joueurs d'une salle se déconnectent, le monde existe uniquement dans leurs IndexedDB locaux.

**Solutions** :
- Au moins un joueur doit revenir pour "réveiller" le monde
- Option : serveur de backup optionnel (non-autoritaire, juste stockage)
- Export manuel du monde (JSON)

---

## 📋 Spécifications détaillées

### Identité

| Propriété | Valeur |
|-----------|--------|
| Algorithme de signature | ECDSA P-256 (ou Ed25519) |
| Format ID joueur | SHA-256 de la clé publique (64 caractères hex) |
| Stockage clé privée | IndexedDB (non-extractable) |
| Expiration session | Heartbeat manqué pendant 10s |

### Personnages

| Propriété | Valeur |
|-----------|--------|
| Max personnages par compte | 5 |
| Données par personnage | ~10 KB |
| Données partagées (compte) | Pseudo, paramètres |
| Données séparées | Position, inventaire, stats |

### Sessions

| Propriété | Valeur |
|-----------|--------|
| Heartbeat interval | 2 secondes |
| Timeout déconnexion | 10 secondes sans heartbeat |
| Résolution conflit | Session la plus ancienne gagne |

---

## ❓ Questions ouvertes

1. **Taille max du monde ?** → Limiter à N chunks ou monde infini avec garbage collection ?
2. **Nombre de joueurs par salle ?** → Limite technique WebRTC ~20-50 pairs ?
3. **Migration Y.js vs Gun.js ?** → Le projet actuel utilise Gun.js dans `server.js`, mais Y.js est recommandé. Choisir une seule technologie.

---

## 🔬 Analyse de faisabilité — Est-ce réaliste ?

### ✅ Ce qui est PROUVÉ et fonctionne déjà

| Technologie | Preuve | Exemples |
|-------------|--------|----------|
| **Y.js + WebRTC** | Production | Notion (CRDT), Figma, Liveblocks |
| **Three.js dans le navigateur** | Des milliers de jeux | Bruno Simon, Sketchfab |
| **WebRTC P2P** | Standard W3C | Discord, Google Meet, Zoom |
| **Crypto dans le navigateur** | Web Crypto API | MetaMask, wallets crypto |
| **IndexedDB** | Standard | Toutes les PWA |

**Verdict : La stack technique de base est solide et éprouvée.**

---

### ⚠️ Ce qui est RÉALISTE mais demande du travail

| Fonctionnalité | Difficulté | Commentaire |
|----------------|------------|-------------|
| **Sync CRDT pour un jeu** | 🔧🔧 | Plus complexe qu'un éditeur texte, mais faisable |
| **Système de chunks** | 🔧 | Pattern classique, bien documenté |
| **Identité crypto** | 🔧 | Comme les wallets, libs disponibles |
| **Persistance IndexedDB** | 🔧 | y-indexeddb fait le travail |
| **10-15 joueurs** | 🔧 | Fonctionne bien en full mesh |

---

### 🟡 Ce qui est AMBITIEUX (faisable mais difficile)

| Fonctionnalité | Problème | Réalité |
|----------------|----------|---------|
| **20+ joueurs** | Bande passante | Full mesh ne scale pas. Super-peers = complexité ++. |
| **Anti-triche** | Pas de serveur autoritaire | On peut **atténuer** mais pas **empêcher** totalement. Un joueur malveillant avec un client modifié peut tricher. |
| **Récupération sociale** | Gardiens doivent être actifs | Si tes 5 amis ont quitté le jeu → compte perdu |
| **Latence jeu d'action** | P2P = variable | OK pour builder/exploration. Difficile pour FPS compétitif. |
| **Mobile** | WebRTC + Three.js | Ça marche mais batterie/perf limitées |

---

### ❌ Ce qui est IRRÉALISTE ou très difficile

| Fonctionnalité | Pourquoi c'est dur | Alternative |
|----------------|-------------------|-------------|
| **50+ joueurs P2P** | Impossible en full mesh | → Sharding en sous-salles de 10-20 |
| **Anti-triche parfait** | Impossible sans serveur | → Accepter que c'est un jeu casual/coopératif |
| **Jeu compétitif sérieux** | P2P = tricheurs | → Ajouter des serveurs validateurs (Phase 2) |
| **Monde vraiment infini** | Mémoire/stockage | → Limite pratique ~1000 chunks |
| **Zéro dépendance externe** | Signaling nécessaire | → Au moins 1 serveur de signaling (peut être auto-hébergé) |

---

### 🎯 Recommandation réaliste

```
┌─────────────────────────────────────────────────────────────┐
│                 CE QU'ON PEUT VRAIMENT FAIRE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ UN JEU CASUAL/COOPÉRATIF avec :                        │
│                                                             │
│  • 2-15 joueurs par salle (optimal)                        │
│  • Construction/exploration (pas FPS compétitif)           │
│  • Monde persistant de taille raisonnable                  │
│  • Triche limitée par réputation/modération sociale        │
│  • Fonctionne même si un joueur part                       │
│  • Gratuit à héberger (juste signaling)                    │
│                                                             │
│  ════════════════════════════════════════════════════════  │
│                                                             │
│  ⚠️ CE QU'ON NE PEUT PAS FAIRE (sans serveurs) :           │
│                                                             │
│  • MMO avec 100+ joueurs                                   │
│  • Jeu compétitif avec enjeux (esport, classement)         │
│  • Anti-triche parfait                                     │
│  • Modération instantanée par une autorité                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 📊 Comparaison honnête avec des jeux existants

| Jeu | Architecture | Ce qu'on peut égaler |
|-----|--------------|----------------------|
| **Minecraft (vanilla)** | Serveur dédié | ❌ Pas la même échelle |
| **Minecraft (LAN 2-8 joueurs)** | P2P local | ✅ Oui, équivalent |
| **Terraria (multi)** | Serveur | ❌ Pas la même fiabilité anti-triche |
| **Valheim** | P2P + host | ✅ Similaire (un joueur = host) |
| **Among Us** | Serveur | ⚠️ Possible mais moins fiable |
| **Agar.io** | Serveur | ❌ Trop de joueurs, temps réel critique |

---

### 🛠️ Plan réaliste par phases

```
PHASE 1 : MVP (1-2 mois)
├── ✅ Réaliste
├── 2-5 joueurs
├── Mouvement + sync positions
├── Monde simple (pas de chunks complexes)
└── Identité basique

PHASE 2 : Gameplay (2-3 mois)
├── ✅ Réaliste  
├── 5-10 joueurs
├── Système de blocs
├── Persistance IndexedDB
└── Chat

PHASE 3 : Social (1-2 mois)
├── ⚠️ Ambitieux mais faisable
├── 10-15 joueurs
├── Modération par vote
├── Zones protégées
└── Récupération compte

PHASE 4 : Scale (optionnel)
├── 🟡 Difficile
├── 15-30 joueurs (super-peers)
├── Serveurs validateurs optionnels
└── Anti-triche renforcé
```

---

### 💡 Ce qui fait que ça PEUT marcher

1. **Cible = jeu coopératif entre amis**
   - Pas besoin d'anti-triche parfait (on joue avec des gens de confiance)
   - 5-10 joueurs = zone confortable pour P2P

2. **Builder/Sandbox plutôt que compétitif**
   - La latence n'est pas critique (pas de headshots)
   - Les conflits sont rares (chacun construit dans sa zone)

3. **Communauté plutôt que anonymat**
   - Salles privées avec URL secrète
   - Modération sociale (les tricheurs sont exclus)

4. **Technologies matures**
   - Y.js, WebRTC, Three.js = battle-tested
   - On n'invente pas de nouvelles technos

---

### ⚡ Le vrai risque

```
┌─────────────────────────────────────────────────────────────┐
│                    RISQUE PRINCIPAL                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Le projet devient trop ambitieux et n'est jamais terminé. │
│                                                             │
│  SOLUTION : Commencer PETIT                                │
│                                                             │
│  Semaine 1 : 2 joueurs qui se voient bouger                │
│  Semaine 2 : Placer/détruire des blocs                     │
│  Semaine 3 : Persistance                                   │
│  ...                                                        │
│  Ajouter des features SEULEMENT quand le core marche       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📌 Décisions à prendre

| Décision | Options | Recommandation |
|----------|---------|----------------|
| **Technologie CRDT** | Y.js (recommandé) vs Gun.js (actuel) | Migrer vers Y.js |
| **Architecture** | CRDT pur vs Hybride avec validateurs | Commencer CRDT pur, ajouter validateurs en Phase 2 |
| **Récupération compte** | Phrase mnémonique + Social Recovery | Implémenter les deux |
| **Anti-doublon session** | Heartbeat + consensus pairs | Implémenter |

---

*Ce document sera mis à jour au fur et à mesure du développement.*
