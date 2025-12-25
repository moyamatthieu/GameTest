# Outils de Développement - Qdrant

Ce dossier contient les outils pour améliorer l'expérience de développement avec Roo Code grâce à l'indexation du code.

## 🚀 Démarrage Rapide

### Option A : Docker (Recommandé)

**Prérequis : Docker Desktop installé**

#### 1. Démarrer Qdrant

```bash
# Démarrer Qdrant en arrière-plan
npm run qdrant:up

# Vérifier que Qdrant tourne
docker ps
```

### Option B : Qdrant Cloud (Sans Docker)

1. Créez un compte gratuit sur https://cloud.qdrant.io
2. Créez un cluster (plan gratuit disponible)
3. Copiez l'URL et la clé API
4. Créez un fichier `.env` à la racine :

```env
QDRANT_URL=https://votre-cluster.qdrant.io
QDRANT_API_KEY=votre-cle-api
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Indexer le code

```bash
npm run index-code
```

### 4. Accéder à l'interface Qdrant

Ouvrir dans le navigateur : http://localhost:6333/dashboard

## 📋 Commandes

- `docker-compose up -d` : Démarre Qdrant
- `docker-compose down` : Arrête Qdrant
- `npm run index-code` : Réindexe tout le code
- `docker-compose logs -f` : Voir les logs Qdrant

## 🔧 Configuration

### Variables d'environnement (optionnel)

Créer un fichier `.env` à la racine :

```env
QDRANT_URL=http://localhost:6333
```

## 📁 Structure

- `qdrant_storage/` : Données Qdrant (gitignored)
- `index-codebase.js` : Script d'indexation

## ⚠️ Note sur les Embeddings

Le script actuel utilise des embeddings factices pour la démonstration. Pour une utilisation en production avec Roo Code, vous pourriez utiliser :

- **OpenAI Embeddings** : Meilleure qualité mais payant
- **Modèle local** : Gratuit mais nécessite plus de config (Sentence Transformers, etc.)

Exemple avec OpenAI :

```bash
npm install openai
```

Puis modifier `generateSimpleEmbedding()` dans `index-codebase.js`.

## 🛑 Arrêter Qdrant

```bash
docker-compose down
```

Pour supprimer aussi les données :

```bash
docker-compose down -v
```
