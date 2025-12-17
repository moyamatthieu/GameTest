# GameTest — projet 3D multijoueur P2P

Jeu 3D simple avec caméra troisième personne et synchronisation P2P via **Y.js** (CRDT).

## Architecture

- **Three.js** : rendu 3D
- **Y.js** : synchronisation P2P avec CRDT (résolution automatique des conflits)
- **y-webrtc** : connexions P2P directes entre joueurs (WebRTC)
- **y-indexeddb** : persistance locale dans le navigateur
- **ES Modules natifs** : pas de build nécessaire

## Avantages Y.js

✅ **Vraiment P2P** : connexions directes entre navigateurs (WebRTC)  
✅ **CRDT** : résolution automatique des conflits  
✅ **Persistance locale** : les données persistent même hors ligne  
✅ **Pas de serveur central** : juste des serveurs de signaling publics  
✅ **Performance** : synchronisation optimisée

## Fichiers

- `index.html` — page d'entrée
- `src/app.js` — logique du jeu

## Démarrage

```bash
python3 -m http.server 8080
```

Ouvrir http://localhost:8080

## Salles privées

Utilisez le hash d'URL pour créer des salles isolées :

- `http://localhost:8080` → salle "threejs-world-default"
- `http://localhost:8080#ma-salle` → salle privée "ma-salle"
- `http://localhost:8080#xyz123` → salle privée "xyz123"

Partagez l'URL complète avec vos amis pour jouer ensemble !

## Contrôles

- **Clic** : activer le contrôle souris
- **Souris** : regarder autour (haut/bas/gauche/droite)
- **Z** ou **W** : avancer
- **S** : reculer
- **Q** ou **A** : gauche
- **D** : droite

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