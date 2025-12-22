# DAoC Clone - Projet de Jeu MMO

Ce projet est un prototype de jeu MMO inspiré par Dark Age of Camelot (DAoC), utilisant une architecture ECS (Entity Component System) partagée entre le client et le serveur.

## Technologies utilisées

- **Langage** : TypeScript
- **Frontend** : Three.js, Vite, Socket.io-client
- **Backend** : Node.js, Express, Socket.io
- **Architecture** : ECS (Entity Component System) personnalisé

## Structure du Projet

- `client/` : Code source du client (rendu 3D, UI, prédiction).
- `server/` : Code source du serveur (logique de jeu, IA, gestion des quêtes).
- `shared/` : Code partagé (définitions ECS, composants, systèmes de mouvement/combat).

## Installation

1. Clonez le dépôt.
2. Installez les dépendances à la racine du projet :
   ```bash
   npm install
   ```

## Lancement en mode Développement

Pour lancer simultanément le serveur et le client en mode développement :

```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000` et le client sur `http://localhost:5173` (ou le port indiqué par Vite).

## Compilation pour la Production

Pour compiler l'ensemble du projet :

1. **Shared** :
   ```bash
   npx tsc -p shared/tsconfig.json
   ```

2. **Serveur** :
   ```bash
   npx tsc -p server/tsconfig.json
   ```

3. **Client** :
   ```bash
   npm run build -w client
   ```

## Fonctionnalités implémentées

- **Mouvement** : Prédiction client et réconciliation serveur.
- **Combat** : Système de ciblage (Tab ou clic), capacités (touches 1, 2, 3), log de combat.
- **Inventaire** : Collecte d'objets, artisanat (touche C), utilisation de potions (touche P).
- **Quêtes** : Système de quêtes avec objectifs de collecte et de chasse. Interaction avec les PNJs (touche F).
- **IA** : PNJs avec comportements de patrouille et d'agression.
- **UI** : Barres de vie, chat, inventaire, HUD de cible.

## Commandes de Jeu

- **ZQSD / Flèches** : Se déplacer.
- **Tab** : Changer de cible.
- **1, 2, 3** : Utiliser des capacités.
- **F** : Interagir avec un PNJ.
- **I** : Ouvrir/Fermer l'inventaire.
- **C** : Fabriquer une épée (nécessite du bois et du fer).
- **P** : Utiliser une potion de soin.
- **X** : Jeter du bois.
- **Entrée** : Activer le chat.
