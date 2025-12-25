# Roadmap - Galactic Dominion

Ce document présente l'état actuel du projet et les étapes futures du développement.

## 1. État Actuel (Fin 2025)

### ✅ Acquis
- **Cœur ECS** : Architecture fonctionnelle avec bitmasks, partagée client/serveur.
- **Multi-échelles** : Navigation fluide entre les vues Galactique, Système et Planétaire.
- **Combat de Base** : Systèmes de tirs, gestion des HP et boucliers directionnels (Wedge).
- **Économie Initiale** : Extraction, stockage et chaînes de production de base.

### ⚠️ Défis & Dette Technique
- **Persistance** : Migration nécessaire du stockage JSON massif vers un schéma SQLite plus granulaire.
- **Logistique** : Finalisation de l'intégration entre le `LogisticsSystem` et le mouvement physique des flottes.
- **Réseau** : Optimisation de la synchronisation (Delta Compression) pour supporter des milliers d'entités.

---

## 2. Plan de Refactorisation (En cours)

### Phase 1 : Unification & Autorité Serveur
- Déplacement de toute la logique de simulation dans `common/ecs/systems/`.
- Le serveur devient l'unique source de vérité pour les calculs (Combat, Économie).
- Le client passe en mode "interpolation et prédiction".

### Phase 2 : Optimisation du Noyau
- Finalisation de l'implémentation des **Bitmasks** dans le `World`.
- Mise en place de **Queries persistantes** pour un accès en O(1) aux entités filtrées.

### Phase 3 : Synchronisation Avancée
- Implémentation de la **Delta Compression** (envoi des changements uniquement).
- Mise en place de l'**Interest Management (AOI)** pour limiter les données envoyées à chaque client.

---

## 3. Prochaines Étapes Prioritaires (Q1 2026)

1.  **Consolidation de la Persistance** : Refactoriser `server/db/index.js` pour des mises à jour partielles.
2.  **Boucle Logistique Complète** : Connecter les ordres de transport au `FleetSystem`.
3.  **Interface de Gestion (UI)** : Créer des panneaux de contrôle pour les flottes et les routes commerciales.
4.  **Tests de Charge** : Simuler plus de 1000 entités actives pour valider les performances du serveur.

---

## 4. Vision Long Terme
- **Génération Procédurale** : Systèmes stellaires et surfaces planétaires diversifiés.
- **Diplomatie & Guildes** : Systèmes de souveraineté territoriale et taxes.
- **Guerre Électronique** : Brouillage, capteurs et furtivité.
