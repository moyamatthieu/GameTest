# Serveur de Persistance de Secours et Hébergement (Non-autoritaire)

Ce serveur est un composant minimaliste conçu pour assurer la continuité du jeu dans une architecture Peer-to-Peer (P2P). Contrairement à un serveur de jeu classique, il n'est **pas autoritaire** : il ne simule pas la logique du jeu et ne valide pas l'état final.

## 🎯 Rôles Principaux

1.  **Hébergement Statique** : Sert les fichiers de l'application web (build Vite) aux navigateurs.
2.  **Persistance "Filet de Sécurité"** : Stocke des snapshots de l'état du monde signés par les joueurs.
3.  **Restauration** : Permet aux clients de récupérer le dernier état connu si tous les nœuds P2P disparaissent.

## 📁 Structure

```
server/
├── src/
│   ├── index.ts          # Point d'entrée (HTTP + Routing)
│   ├── config.ts         # Configuration (Ports, Limites, Chemins)
│   ├── routes/           # Handlers d'API (Health, Persistence)
│   ├── storage/          # Gestion du système de fichiers (Snapshots)
│   ├── crypto/           # Vérification des signatures Ed25519
│   ├── http/             # Utilitaires HTTP (Rate limit, JSON parsing)
│   └── static/           # Service de fichiers statiques + SPA Fallback
├── data/                 # Stockage des snapshots (ignoré par git)
├── package.json          # Dépendances et scripts
└── tsconfig.json         # Configuration TypeScript
```

## � API Endpoints

### `GET /health`
Vérifie l'état du serveur.
- **Réponse** : `200 OK` avec `{"status": "ok", "timestamp": "..."}`.

### `POST /api/persistence/snapshot`
Enregistre un nouveau snapshot signé.
- **Payload** :
  ```json
  {
    "clusterId": "string",
    "data": "string (base64 or raw)",
    "publicKey": "string (base58)",
    "signature": "string (base58)",
    "timestamp": number
  }
  ```
- **Validation** : Le serveur vérifie que la signature correspond aux données et à la clé publique fournie.

### `GET /api/persistence/snapshot/:clusterId`
Récupère le dernier snapshot valide pour un cluster donné.
- **Réponse** : Le snapshot complet (incluant signature et clé publique).
- **Erreur** : `404 Not Found` si aucun snapshot n'existe pour ce cluster.

## �🔒 Sécurité et Intégrité

Bien que non-autoritaire, le serveur applique des règles strictes pour protéger son intégrité :

-   **Signatures Cryptographiques** : Seuls les snapshots signés avec une clé Ed25519 valide sont acceptés.
-   **Validation de Format** : Vérification des types, de la taille des payloads et de la cohérence des horodatages.
-   **Rate Limiting** : Protection contre le spam de requêtes de sauvegarde et de restauration.
-   **Rétention** : Conservation limitée (ex: 10 derniers snapshots par cluster) pour éviter l'épuisement de l'espace disque.

## ⚙️ Utilisation

### Installation

```bash
cd server
npm install
```

### Développement

```bash
npm run build  # Compile le TypeScript vers dist/
npm start      # Lance le serveur (nécessite un build préalable)
```

### Configuration (.env)

Le serveur peut être configuré via des variables d'environnement :

-   `PORT` : Port d'écoute (défaut: 3000)
-   `HOST` : Interface d'écoute (défaut: 0.0.0.0)
-   `STATIC_DIR` : Chemin vers les fichiers statiques (défaut: ../dist)
-   `DATA_DIR` : Chemin vers le stockage des données (défaut: ./data)
-   `MAX_SNAPSHOTS_PER_CLUSTER` : Nombre de snapshots conservés (défaut: 10)

## 🧪 Tests

Les tests d'intégration du serveur se trouvent dans le dossier racine :

```bash
npm run test:server
```

---

*Note : Ce serveur est conçu pour être léger et peut être auto-hébergé ou déployé sur un VPS standard.*
