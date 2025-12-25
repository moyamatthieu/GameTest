# Jeux Gestion (Three.js RTS)

Un MMORTS spatial persistant en 3D développé avec Three.js, Node.js et une architecture ECS.

## 🚀 Démarrage rapide

### Installation
```bash
npm install
cd server && npm install
```

### Développement
```bash
# Lance le client et le serveur simultanément
npm run dev:all
```
Le client est accessible sur http://localhost:3000 et le serveur sur http://localhost:3001.

## 📖 Documentation

Pour comprendre le projet en profondeur, consultez les documents suivants :

- [**ARCHITECTURE.md**](ARCHITECTURE.md) : Détails techniques, architecture ECS et structure du moteur.
- [**GAME_DESIGN.md**](GAME_DESIGN.md) : Vision du jeu, mécaniques de gameplay et systèmes économiques.
- [**ROADMAP.md**](ROADMAP.md) : État actuel du développement et objectifs futurs.
- [**REFACTORING_NOTES.md**](REFACTORING_NOTES.md) : 🆕 Détails de la refactorisation majeure (Architecture Serveur-Authoritative).
- [**USAGE_GUIDE.md**](USAGE_GUIDE.md) : 🆕 Guide pratique pour développer avec la nouvelle architecture.
- [**SPEC_KIT_GUIDE.md**](SPEC_KIT_GUIDE.md) : 🆕 Guide d'utilisation de Spec Kit (Spec-Driven Development).

## 🛠️ Développement avec Spec Kit

Ce projet utilise **Spec Kit** pour un développement structuré et basé sur des spécifications exécutables.

### Commandes Principales (dans GitHub Copilot)

```bash
/speckit.specify        # Créer une nouvelle spécification de feature
/speckit.plan           # Générer un plan d'implémentation technique
/speckit.tasks          # Décomposer en tâches actionnables
/speckit.implement      # Exécuter automatiquement l'implémentation
```

### Exemple : Ajouter une Feature

1. **Spécifier** : `/speckit.specify Ajouter un système de commerce galactique`
2. **Planifier** : `/speckit.plan Utiliser Fleet + nouveau composant Trade`
3. **Implémenter** : `/speckit.tasks` puis `/speckit.implement`

**📚 Voir [SPEC_KIT_GUIDE.md](SPEC_KIT_GUIDE.md) pour un guide complet.**

## �️ Stack Technique

- **Frontend** : [Three.js](https://threejs.org/) (Rendu 3D), [Vite](https://vitejs.dev/) (Build tool).
- **Backend** : [Node.js](https://nodejs.org/), [WebSockets](https://github.com/websockets/ws) (Communication temps réel).
- **Base de données** : [SQLite](https://www.sqlite.org/) (Persistance des entités via JSON).
- **Architecture** : ECS (Entity Component System) avec bitmasks pour des performances optimales.

## 📁 Structure du projet

```
jeux_gestion/
├── common/             # Logique partagée (ECS, Systèmes, Composants)
│   └── ecs/
│       ├── components.js
│       ├── World.js
│       └── systems/    # ⚡ TOUTE la logique métier (serveur uniquement)
├── server/             # Serveur Node.js & SQLite
│   ├── ecs/            # ServerWorld avec tous les systèmes
│   └── db/             # Persistence SQLite
├── src/                # Client Three.js
│   ├── core/           # Game, NetworkManager, AssetManager
│   ├── render/         # 🆕 Systèmes de rendu (MeshSync, etc.)
│   ├── input/          # 🆕 Gestionnaires d'input (BuildingPlacer, etc.)
│   ├── scenes/         # Scènes Three.js (Planet, System, Galaxy)
│   └── ui/             # Interface HTML/CSS
├── public/             # Assets statiques
└── plans/              # Archives et documents de planification
```

**⚠️ Important :** Le client (`src/`) ne contient **AUCUNE logique de simulation**.
Toute la logique métier est dans `common/ecs/systems/` et exécutée uniquement par le serveur.

## 🎮 Fonctionnalités principales

- **Économie Complexe** : Chaînes de production, gestion des ressources et stockage.
- **Système de Flottes** : Gestion de groupes de vaisseaux et ordres de mouvement.
- **Combat Tactique** : Boucliers directionnels et gestion des dégâts.
- **Souveraineté** : Contrôle de territoires et influence.
- **Multi-échelles** : Navigation entre les échelles Galactique, Système et Planétaire.
- **Construction Duale** : Système de placement intelligent sur surfaces planétaires (sphérique) et dans l'espace (grille orbitale).

## 🤝 Licence

Ce projet est sous licence MIT.
