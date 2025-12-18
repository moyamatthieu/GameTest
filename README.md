# SSV CORE v0.9.7 - Maillage Spatial Distribué

Jeu 3D multijoueur **entièrement P2P** avec construction de blocs, terrain procédural et architecture distribuée robuste.

> *"Un monde partagé, une architecture décentralisée"*

![Version](https://img.shields.io/badge/version-0.9.7-blue)
![Tech](https://img.shields.io/badge/tech-P2P-green)
![Status](https://img.shields.io/badge/status-MVP_Complete-success)

---

## 🚀 Fonctionnalités

### 🎮 Gameplay
- ✅ **Construction**: Clic gauche pour placer des blocs
- ✅ **Destruction**: Clic droit pour miner des blocs (raycast précis)
- ✅ **Inventaire**: 9 types de blocs différents (pierre, terre, bois, herbe, sable, neige, eau, obsidienne, or)
- ✅ **Collision AABB**: Détection joueur/blocs empêche la traversée
- ✅ **Chat P2P**: Communication temps réel entre joueurs (Entrée pour activer)
- ✅ **Course**: Shift pour courir plus vite (×1.8)

### 🌍 Génération de Monde
- ✅ **Terrain procédural**: Algorithme Simplex Noise 2D intégré
- ✅ **Biomes**: Herbe, sable, terre, pierre, neige selon hauteur
- ✅ **Génération 32×32**: ~2000-4000 blocs par terrain
- ✅ **Variations**: Hauteur 0-8 blocs, paysages variés

### 🏗️ Architecture P2P
- ✅ **PeerJS**: Réseau mesh WebRTC
- ✅ **Horloge de Lamport**: Ordre logique déterministe
- ✅ **Quorum de proximité**: Validation collaborative (1 témoin min)
- ✅ **Découverte transitive**: Les peers se trouvent automatiquement
- ✅ **Résolution de conflits**: Basée sur Lamport + créateur

### 💾 Persistence Multi-Niveau
- ✅ **localStorage**: Sauvegarde par joueur (position, couleur)
- ✅ **Mesh P2P**: Synchronisation temps réel
- ✅ **Backup serveur**: REST API Python (optionnel)
- ✅ **SaveTrigger intelligent**: Distance (5m), temps (30s/60s), actions

---

## 📦 Technologies

- **Three.js r128**: Rendu 3D (WebGL)
- **PeerJS 1.5.2**: WebRTC P2P networking
- **Tailwind CSS**: UI styling (CDN)
- **Python HTTP Server**: Backup API (optionnel)
- **Vanilla JavaScript**: Pas de framework, ES6+

---

## 🎯 Démarrage Rapide

### 1. Cloner le projet

```bash
git clone <repo-url>
cd GameTest
```

### 2. Lancer le serveur web

```bash
python3 -m http.server 8000
```

### 3. (Optionnel) Lancer le serveur de backup

Terminal séparé:
```bash
chmod +x server.py
python3 server.py
```

### 4. Ouvrir le jeu

- Ouvrir `http://localhost:8000`
- Entrer un nom de joueur (ex: `alice`)
- Cliquer pour activer le pointer lock
- Profiter ! 🎮

### Multi-Joueur

1. Ouvrir plusieurs onglets/fenêtres
2. Se connecter avec des noms différents
3. Les joueurs se découvrent automatiquement
4. Construisez ensemble !

---

## 🎮 Contrôles

### Mouvement
- **ZQSD** ou **WASD**: Déplacements
- **Shift**: Course (×1.8 vitesse)
- **Souris**: Rotation caméra
- **Clic**: Activer pointer lock

### Construction
- **Clic gauche**: Placer un bloc
- **Clic droit**: Détruire un bloc
- **Touches 1-9**: Sélectionner type de bloc

### Interface
- **Entrée**: Activer/désactiver chat
- **Échap**: Libérer la souris

---

## 📚 Documentation

- **[CHANGELOG.md](CHANGELOG.md)**: Historique des versions et features
- **[TESTING.md](TESTING.md)**: Guide de test complet
- **[AUDIT.md](AUDIT.md)**: Analyse du projet
- **[PERSISTENCE.md](PERSISTENCE.md)**: Architecture de sauvegarde
- **[SPECS.md](SPECS.md)**: Spécifications techniques
- **[ROADMAP.md](ROADMAP.md)**: Feuille de route

---

## 🏗️ Architecture

### Réseau P2P
```
Player A ←→ Player B
    ↓          ↓
Player C ←→ Player D
```
- Mesh complet (tous connectés à tous)
- Découverte transitive
- Broadcast efficace (45ms interval)

### Persistence
```
Actions → SaveTrigger → localStorage
                     ↘
                       Mesh P2P → Peers
                     ↘
                       Backup Server (Python)
```

### Validation (Quorum)
```
Player → Action → Request Witnesses → Timeout 500ms
                                   ↓
                    Validate (1+ witness) → Commit
```

---

## 🔧 Configuration

Fichier: `index.html` (section CONFIG)

```javascript
const CONFIG = {
    TERRAIN_SIZE: 32,        // Taille terrain généré
    TERRAIN_HEIGHT: 8,       // Hauteur max terrain
    BROADCAST_MS: 45,        // Intervalle broadcast
    AUTOSAVE_INTERVAL: 30000 // Auto-save (ms)
};
```

### Types de Blocs

| Nom | Couleur | Usage |
|-----|---------|-------|
| Stone | Gris | Roche profonde |
| Dirt | Marron | Sous-sol |
| Wood | Beige | Construction |
| Grass | Vert | Surface prairie |
| Sand | Sable | Plages |
| Snow | Blanc | Sommets |
| Water | Bleu | Lacs (décoratif) |
| Obsidian | Noir | Rare/décoration |
| Gold | Doré | Rare/décoration |

---

## 🚀 Performance

- **FPS**: 60 stable (<5000 blocs)
- **Latence P2P**: <50ms (local)
- **Génération terrain**: <100ms
- **Mémoire**: ~150MB par onglet
- **localStorage**: ~500KB par joueur

---

## 🐛 Bugs Connus

- Terrain généré une seule fois (nouveau joueur)
- Pas de chunks (tout en mémoire)
- Jump désactivé (peut être ajouté)

---

## 🛠️ Développement

### Structure
```
GameTest/
├── index.html          # Jeu complet (~1750 lignes)
├── server.py           # Backup API (Python)
├── package.json        # Métadonnées npm
├── tsconfig.json       # Config TypeScript (optionnel)
├── README.md           # Ce fichier
├── CHANGELOG.md        # Historique versions
├── TESTING.md          # Guide de test
├── AUDIT.md            # Analyse projet
├── PERSISTENCE.md      # Doc persistence
├── SPECS.md            # Spécifications
└── ROADMAP.md          # Feuille de route
```

### Technologies
- Pas de build nécessaire
- CDN pour Three.js, PeerJS, Tailwind
- Vanilla JS (ES6+)
- Python 3 pour backup serveur

---

## 📈 Roadmap

- [x] Phase 1: Networking P2P
- [x] Phase 2A: Gameplay (destruction, collision, chat)
- [x] Phase 2B: Architecture (Lamport, quorum)
- [x] Phase 2C: Contenu (inventaire, terrain)
- [ ] Phase 3: Optimisation (chunks, culling, LOD)
- [ ] Phase 4: Gameplay+ (jump, vie, crafting)
- [ ] Phase 5: Contenu+ (biomes, structures)

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'feat: Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Pull Request

---

## 📝 License

MIT License - Voir LICENSE pour détails

---

## 👥 Auteurs

- **SSV Team** - Maillage Spatial Distribué

---

## 🙏 Remerciements

- Three.js pour le rendu 3D
- PeerJS pour la simplicité WebRTC
- La communauté P2P/CRDT

---

*SSV CORE v0.9.7 - "Un monde partagé, une architecture décentralisée"*

## Multijoueur

- Ouvrez plusieurs onglets avec la même URL (même hash)
- Ou partagez l'URL sur votre réseau local
- Les joueurs apparaissent en vert
- Connexion P2P directe via WebRTC
- Les données persistent localement (IndexedDB)

## Hot reload (optionnel)

**Live Server (VS Code) :**
- Installer extension "Live Server"
- Clic droit sur `index.html` → "Open with Live Server"

**browser-sync :**
```bash
npx browser-sync start --server --files "**/*" --port 8080
```

## Technique

**Serveurs de signaling** (juste pour connexion initiale, pas de données) :
- wss://signaling.yjs.dev
- wss://y-webrtc-signaling-eu.herokuapp.com
- wss://y-webrtc-signaling-us.herokuapp.com

Après connexion, tout est P2P direct entre navigateurs.

# GameTest