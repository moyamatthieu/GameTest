# Quickstart: P2P State Sync

## Overview

Cette fonctionnalité permet de voir les autres joueurs bouger dans l'espace. Elle lie le `ConnectionManager` (réseau) au `Renderer` (affichage) via le `SyncService`.

## Setup for Developers

1. **Lancer deux instances du jeu** :
   - Ouvrez deux onglets sur `http://localhost:5173`.
2. **Connexion** :
   - Copiez l'ID de l'instance A et connectez l'instance B à A via l'UI de réseau.
3. **Mouvement** :
   - Déplacez le vaisseau dans l'instance A (via les contrôles clavier/souris).
   - Observez le vaisseau de A apparaître et bouger dans l'instance B.

## Key Components

- `SyncService` : Démarre une boucle `setInterval` à 100ms pour envoyer l'état local. Écoute les messages entrants pour mettre à jour les joueurs distants.
- `RemotePlayerManager` : Gère la création des `Object3D` Three.js pour les autres joueurs. Utilise la `PrimitiveFactory` pour garantir la cohérence visuelle.

## Troubleshooting

- **Le vaisseau distant n'apparaît pas** : Vérifiez la console pour des erreurs de type `STATE_UPDATE`. Assurez-vous que la connexion PeerJS est bien établie (`OPEN`).
- **Mouvement saccadé** : C'est normal pour cette phase (pas d'interpolation). Vérifiez que l'intervalle de 100ms est respecté.
