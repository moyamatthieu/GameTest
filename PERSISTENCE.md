# 💾 Architecture de Persistance - SSV CORE

## 🎯 Problématique Centrale

Dans un jeu P2P décentralisé, la persistance des données pose des défis uniques :
- **Pas de serveur autoritaire** : Qui décide de l'état "vrai" du monde ?
- **Joueurs éphémères** : Les joueurs vont et viennent
- **Conflits potentiels** : Deux joueurs peuvent modifier le même espace
- **Résilience** : Le monde doit survivre même si tous les joueurs partent

---

## 📊 Catégorisation des Données

### 1. Données MONDE (Persistance Longue Durée)
| Donnée | Description | Priorité | Fréquence de changement |
|--------|-------------|----------|------------------------|
| Blocs/Entités | Position, type, couleur, créateur | 🔴 Critique | À chaque construction |
| Lois physiques | Gravité, règles globales | 🟡 Important | Rare (admin only) |
| Historique | Log des actions | 🟢 Optionnel | Continue |

### 2. Données JOUEUR (Persistance Moyenne Durée)
| Donnée | Description | Priorité | Fréquence de changement |
|--------|-------------|----------|------------------------|
| Spawn/Dernière position | Où réapparaître | 🟡 Important | À la déconnexion |
| Apparence/Couleur | Identité visuelle | 🟢 Faible | Rare |
| Inventaire (futur) | Objets possédés | 🔴 Critique | Variable |
| Stats (futur) | Expérience, niveau | 🟡 Important | Variable |

### 3. Données TEMPS RÉEL (Ne pas persister)
| Donnée | Description | Raison |
|--------|-------------|--------|
| Position live | Position actuelle du joueur | Synchronisée P2P en temps réel |
| État de connexion | Online/Offline | Éphémère par nature |
| Messages chat | Communications | Volatil, pas d'historique requis |

---

## 👤 QUI Sauvegarde ?

### Architecture à 3 niveaux

```
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU 1 : LOCAL                         │
│  Chaque joueur sauvegarde SES données dans localStorage     │
│  - Sa dernière position                                     │
│  - Ses préférences                                          │
│  - Son cache du monde (ce qu'il a vu)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU 2 : MESH P2P                      │
│  Les pairs échangent et valident les changements            │
│  - Quorum de voisinage pour valider les actions             │
│  - Synchronisation continue de l'état du monde              │
│  - Le plus ancien pair devient "gardien temporaire"         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU 3 : SERVEUR BACKUP                │
│  Le Super Architecte (ou dernier joueur) backup le monde    │
│  - Sauvegarde périodique de l'état global                   │
│  - Point de restauration si tous les joueurs partent        │
│  - Pas d'autorité, juste de la redondance                   │
└─────────────────────────────────────────────────────────────┘
```

### Règles d'Autorité

| Acteur | Peut sauvegarder... | Vers... |
|--------|---------------------|---------|
| Tout joueur | Ses propres données | localStorage |
| Tout joueur | Cache du monde | localStorage |
| Super Architecte | État global du monde | Serveur backup |
| Dernier joueur | État global du monde | Serveur backup (fallback) |

---

## ⏰ QUAND Sauvegarder ?

### Événements Déclencheurs

```javascript
// 1. ACTIONS CRITIQUES - Sauvegarde immédiate
onBlockPlaced()      → saveLocal() + broadcastToMesh()
onBlockDestroyed()   → saveLocal() + broadcastToMesh()

// 2. INTERVALLE RÉGULIER - Auto-save
setInterval(() => {
    saveLocal();           // Toujours
    if (isArchitect || isLastPlayer()) {
        saveToServer();    // Backup global
    }
}, 30000); // 30 secondes

// 3. ÉVÉNEMENTS DE VIE - Sauvegarde préventive
onTabHidden()        → saveLocal() + saveToServer()
onBeforeUnload()     → saveLocal() (sync, rapide)
onPlayerDisconnect() → promoteNextGuardian()

// 4. DEMANDE EXPLICITE
onSaveButtonClick()  → saveLocal() + saveToServer()
```

### Priorités de Sauvegarde

| Priorité | Événement | Action |
|----------|-----------|--------|
| 🔴 P0 | Construction/Destruction | Sync immédiate |
| 🟡 P1 | Déconnexion | Sauvegarde complète |
| 🟢 P2 | Auto-save périodique | Sauvegarde incrémentale |

---

## 📍 OÙ Sauvegarder ?

### Stratégie Multi-Couches

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  localStorage  │    │   Mesh P2P     │    │    Serveur     │
│    (Client)    │    │   (Réseau)     │    │    (Backup)    │
├────────────────┤    ├────────────────┤    ├────────────────┤
│ • Rapide       │    │ • Distribué    │    │ • Persistant   │
│ • Personnel    │    │ • Résilient    │    │ • Global       │
│ • ~5-10 MB     │    │ • Temps réel   │    │ • Illimité     │
└────────────────┘    └────────────────┘    └────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  RÉCONCILIATION   │
                    │  En cas de conflit│
                    │  timestamp gagne  │
                    └───────────────────┘
```

### Clés de Stockage localStorage

```javascript
const STORAGE_KEYS = {
    // Données personnelles du joueur
    'ssv_player': {
        username: 'string',
        color: 'number',
        lastPosition: { x, y, z },
        lastSeen: 'timestamp'
    },
    
    // Cache local du monde
    'ssv_world': {
        entities: [...],
        timestamp: 'number',
        author: 'string'
    },
    
    // Préférences
    'ssv_prefs': {
        volume: 0.8,
        sensitivity: 1.0
    }
};
```

---

## 🔧 COMMENT Sauvegarder ?

### Structure des Données Sauvegardées

```javascript
const WorldBackup = {
    // Métadonnées
    version: "0.9.7",
    savedAt: "2025-12-18T15:00:00Z",
    author: "admin",
    
    // État du monde
    world: [
        {
            id: "ent_abc123",
            type: "block",
            position: { x: 10, y: 5, z: 3 },
            color: 0x3b82f6,
            creator: "player1",
            createdAt: 1702912800000
        }
    ],
    
    // Positions de spawn des joueurs (PAS position live)
    playerSpawns: {
        "player1": { x: 0, y: 0, z: 0, lastSeen: 1702912800000 },
        "player2": { x: 5, y: 0, z: 10, lastSeen: 1702912850000 }
    },
    
    // Lois du monde
    laws: {
        gravity: 9.81,
        buildEnabled: true
    }
};
```

### Stratégie de Réconciliation

Quand un joueur rejoint et a un état local différent du mesh :

```javascript
function reconcile(localData, meshData, serverData) {
    // 1. Prendre le plus récent comme base
    const sources = [localData, meshData, serverData]
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);
    
    let mergedWorld = new Map();
    
    // 2. Fusionner les entités (plus récent gagne par entité)
    sources.forEach(source => {
        source.world.forEach(entity => {
            const existing = mergedWorld.get(entity.id);
            if (!existing || entity.createdAt > existing.createdAt) {
                mergedWorld.set(entity.id, entity);
            }
        });
    });
    
    return {
        world: Array.from(mergedWorld.values()),
        timestamp: Date.now()
    };
}
```

---

## 🔄 Flux de Données Complet

```
JOUEUR CONSTRUIT UN BLOC
         │
         ▼
┌─────────────────────┐
│ 1. Création locale  │
│    (optimistic)     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. Broadcast P2P    │
│    (intent_build)   │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Validation mesh  │
│    (quorum ok?)     │
└─────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
  ✅ OK     ❌ REJET
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ Commit  │ │ Rollback│
│ local   │ │ local   │
└─────────┘ └─────────┘
    │
    ▼
┌─────────────────────┐
│ 4. Save localStorage│
└─────────────────────┘
    │
    ▼ (si admin ou timer)
┌─────────────────────┐
│ 5. Backup serveur   │
└─────────────────────┘
```

---

## 📋 Résumé Décisionnel

| Question | Réponse |
|----------|---------|
| **Sauvegarder les positions live ?** | ❌ Non, c'est du P2P temps réel |
| **Sauvegarder les spawns ?** | ✅ Oui, dernière position connue |
| **Qui backup le monde ?** | Super Architecte ou dernier joueur |
| **Fréquence auto-save ?** | 30 secondes |
| **Où en priorité ?** | localStorage > Mesh > Serveur |
| **Gestion des conflits ?** | Timestamp le plus récent gagne |

---

## 🚀 Prochaines Étapes

1. [ ] Séparer les données `player` et `world` dans le localStorage
2. [ ] Implémenter la sauvegarde du spawn (dernière position)
3. [ ] Ajouter la détection du "dernier joueur" pour backup
4. [ ] Créer la logique de réconciliation
5. [ ] Ajouter un système de versioning des sauvegardes
