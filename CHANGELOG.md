# Changelog - SSV CORE v0.9.7

## Version 0.9.7 - MVP Complet (18 Décembre 2025)

### 🎮 PARTIE A - Gameplay Complet

#### A1: Destruction de Blocs
- **Clic droit** pour détruire un bloc ciblé
- Raycast pour sélection précise
- Broadcast `intent_destroy` au mesh P2P
- Suppression synchronisée du `worldRegistry`
- Prévention du menu contextuel

#### A2: Collision Joueur/Blocs (AABB)
- Détection AABB (Axis-Aligned Bounding Box)
- Vérification des blocs voisins avant mouvement
- Sauvegarde position avant déplacement
- Rollback en cas de collision
- Collision verticale et horizontale

#### A3: Chat P2P Temps Réel
- Activation/désactivation avec **Entrée**
- Messages broadcastés à tous les peers
- Affichage avec timestamp et couleurs joueur
- Historique limité à 50 messages
- Auto-scroll et escape HTML

---

### 🏗️ PARTIE B - Architecture P2P Robuste

#### B1: Horloge de Lamport
- `State.lamportClock` pour ordre logique
- `tick()`: incrémentation locale sur événements
- `sync(receivedClock)`: synchronisation avec pairs
- `resolveConflict()`: résolution déterministe
- Ordre total même sans synchronisation physique

#### B2: Quorum de Proximité
- Validation collaborative des actions
- 1 témoin minimum requis
- Timeout 500ms pour réponse
- Messages: `request_witness`, `witness_ack`
- Bypass automatique pour admin et mode solo
- `pendingActions` avec Map pour tracking

---

### 🎨 PARTIE C - Contenu et Génération

#### C1: Inventaire Multi-Blocs
**9 Types de Blocs:**
- `stone` (Pierre) - Gris #808080
- `dirt` (Terre) - Marron #8B4513
- `wood` (Bois) - Beige #DEB887
- `grass` (Herbe) - Vert #228B22
- `sand` (Sable) - Sable #F4A460
- `snow` (Neige) - Blanc #FFFAFA
- `water` (Eau) - Bleu #1E90FF
- `obsidian` (Obsidienne) - Noir #1C1C1C
- `gold` (Or) - Doré #FFD700

**Interface:**
- Hotbar avec 9 slots visibles
- Sélection avec touches **1-9**
- Highlight visuel du slot actif
- Clic sur slot pour sélection manuelle

**Implémentation:**
- `State.inventory`: array de 9 slots
- `State.selectedSlot`: index 0-8
- `BLOCK_TYPES`: définitions avec couleurs
- Recettes incluent `blockType`
- Construction utilise le bloc sélectionné

#### C2: Terrain Procédural avec Simplex Noise
**Algorithme:**
- Bruit Simplex 2D intégré (pas de dépendance externe)
- Seed aléatoire par génération
- 2 octaves de bruit pour variation
- Interpolation smooth

**Génération:**
- Taille: 32x32 blocs (configurable)
- Hauteur max: 8 blocs (configurable)
- ~2000-4000 blocs par terrain
- Généré automatiquement pour nouveaux joueurs

**Biomes par Hauteur:**
- **Surface haute** (>2): `grass` - Prairie
- **Surface basse** (≤2): `sand` - Plage
- **Sous-sol** (3 couches): `dirt` - Terre
- **Profondeur**: `stone` - Roche
- **Sommets**: `snow` - Montagnes enneigées

**Features:**
- Player spawn au centre, 5 blocs au-dessus
- IDs uniques: `terrain_x_y_z`
- Intégration Lamport clock
- Synchronisation P2P automatique

---

## Améliorations Techniques

### Persistence Multi-Niveau
- **localStorage**: sauvegarde par joueur (`ssv_player_<username>`)
- **Mesh P2P**: synchronisation temps réel
- **Serveur Backup**: REST API Python (port 8080)

### SaveTrigger Intelligent
- **Distance**: auto-save tous les 5m parcourus
- **Temps**: 30s (locale) / 60s (serveur)
- **Actions**: build, destroy, law change
- Sauvegarde forcée: tab hidden, page unload

### Réseau P2P
- Découverte transitive des peers
- Broadcast optimisé (45ms interval)
- Messages typés: `intent_build`, `intent_destroy`, `chat`, `request_witness`, etc.
- Gestion couleurs unique par joueur

### Physique
- Gravité configurable par admin
- Vitesse de course (Shift × 1.8)
- Jump désactivé (peut être ajouté)
- Caméra third-person avec smooth lerp

---

## Configuration

```javascript
const CONFIG = {
    TERRAIN_SIZE: 32,        // Taille du terrain généré
    TERRAIN_HEIGHT: 8,       // Hauteur maximale
    BROADCAST_MS: 45,        // Intervalle de broadcast
    AUTOSAVE_INTERVAL: 30000 // 30 secondes
};
```

---

## Utilisation

### Contrôles
- **ZQSD/WASD**: Déplacement
- **Shift**: Course
- **Souris**: Rotation caméra
- **Clic gauche**: Construire
- **Clic droit**: Détruire
- **1-9**: Sélection bloc inventaire
- **Entrée**: Chat

### Multi-Joueur
1. Lancer `server.py` (backup serveur optionnel)
2. Ouvrir plusieurs onglets/fenêtres
3. Se connecter avec usernames différents
4. Les peers se découvrent automatiquement
5. Actions validées par quorum

---

## État du Projet

✅ **Phase 1**: Networking P2P (PeerJS)  
✅ **Phase 2A**: Gameplay (Destruction, Collision, Chat)  
✅ **Phase 2B**: Architecture (Lamport, Quorum)  
✅ **Phase 2C**: Contenu (Inventaire, Terrain)  

**Next Steps:**
- Optimisation: chunks, culling, LOD
- Gameplay: jump, vie/dégâts, crafting
- Contenu: plus de biomes, structures
- UI: mini-map, inventaire étendu
- Performance: Web Workers pour terrain gen

---

## Statistiques

- **Lignes de code**: ~1750 (index.html)
- **Types de messages P2P**: 9
- **Types de blocs**: 9
- **Blocs générés par terrain**: 2000-4000
- **Temps de génération**: <100ms
- **Latence réseau**: <50ms (local)

---

*SSV CORE v0.9.7 - Maillage Spatial Distribué*  
*"Un monde partagé, une architecture décentralisée"*
