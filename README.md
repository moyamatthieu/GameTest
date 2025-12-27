# MMORTS - RTS Multi-Échelle avec Architecture P2P

Un jeu de stratégie en temps réel (RTS) massivement multijoueur avec architecture Peer-to-Peer (P2P) décentralisée et validation distribuée. Le joueur commande des flottes, gère des bases, et développe un empire galactique à travers trois échelles tactiques (Galaxy, System, Planet).

## 🎮 Paradigme de Jeu

Ce jeu est un **RTS pur** où le joueur donne des **ordres** à des unités (comme StarCraft ou Supreme Commander), **PAS** un jeu de pilotage direct ou simulateur spatial.

**Contrôles RTS Standards**:
- **Clic gauche** : Sélection d'unités
- **Clic gauche + glisser** : Box selection (groupes)
- **Clic droit** : Ordre contextuel (déplacement, attaque, extraction)
- **Touches 1-0** : Groupes de contrôle
- **Shift + clic** : File d'attente d'ordres

**Vue Top-Down Stricte** : Caméra toujours au-dessus de la scène (angle 60-90°) pour lisibilité tactique maximale.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Développement (Frontend)
```bash
npm run dev
```
L'application sera disponible sur `http://localhost:5173`.

### Serveur de Persistance (Optionnel en local)
Le serveur gère l'hébergement des fichiers statiques et la persistance de secours.
```bash
cd server
npm install
npm run build
npm start
```

## 🧪 Tests

Le projet utilise **Vitest** pour les tests unitaires et d'intégration, et **Playwright** pour les tests de bout en bout (E2E).

### Tests Unitaires et Intégration
```bash
npm test
```

### Tests du Serveur de Persistance
```bash
npm run test:server
```

### Tests E2E (Playwright)
```bash
npx playwright test
```

## 📁 Structure du Projet

- `src/core/world/`: Génération déterministe de l'univers (Lattice, Routes, Heightmaps)
- `src/ecs/`: Architecture Entity-Component-System pour la logique RTS
  - `components/`: Données pures (Position, Health, Owner, etc.)
  - `systems/`: Logique de simulation (MovementSystem, CombatSystem, PathfindingSystem)
- `src/renderer/`: Moteurs de rendu multi-échelle (Galaxie, Système, Planète) avec Three.js
- `src/ui/input/`: Capture des contrôles RTS (box selection, ordres contextuels, groupes)
- `server/`: Serveur de persistance non-autoritaire (hébergement + snapshots signés)
- `specs/`: Spécifications détaillées des fonctionnalités
- `tests/`: Suites de tests automatisés (unit, integration, E2E)

## 📜 Principes du Projet
Consultez la [Constitution](.specify/memory/constitution.md) pour comprendre les choix architecturaux et les règles de développement.

**Principes clés** :
- **RTS Pur** : Contrôle par ordres, pas de pilotage direct (Principes XII, XV)
- **Architecture ECS** : Séparation stricte logique/rendu/input (Principe XIV)
- **Pathfinding sur Grille** : Navigation intelligente, pas de physique spatiale (Principe XVI)
- **P2P Décentralisé** : Validation distribuée par consensus (Principe I)
- **Multi-Échelle** : Galaxy → System → Planet avec vue top-down à chaque niveau (Principe II)
- **Construction RTS** : Preview-placement-queue pour bâtiments et unités (Principe XVII)

---
*Inspiré par Mankind (1998), StarCraft, et Supreme Commander*
