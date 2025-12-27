# Plan d'Implémentation : Extraction de Ressources et Cargo

## Phase 1 : Fondations (ECS & Types)
1. Définir l'énumération `ResourceType` avec les 10 types de la Constitution.
2. Créer `ResourceComponent` et l'intégrer au `WorldGenerator` pour que les planètes naissent avec des ressources.
3. Créer `CargoComponent` et l'ajouter aux entités de type vaisseau.
4. Créer `MiningStateComponent` pour gérer l'état éphémère du minage.

## Phase 2 : Système d'Extraction
1. Créer `MiningSystem` dans `src/ecs/systems/`.
2. Implémenter la logique de proximité : vérifier si le vaisseau est assez proche de la planète cible.
3. Implémenter la logique de transfert : ajouter des ressources au `CargoComponent` à intervalles réguliers.
4. Gérer l'arrêt automatique si le cargo est plein ou si le vaisseau s'éloigne.

## Phase 3 : Interface Utilisateur (HUD)
1. Ajouter un écouteur d'input pour la touche 'G'.
2. Créer un composant UI `CargoDisplay` dans le HUD pour afficher l'inventaire.
3. Afficher un indicateur visuel (barre de progression ou texte) pendant l'extraction.

## Phase 4 : Synchronisation P2P
1. Ajouter les messages `MINING_STARTED` et `MINING_STOPPED` au protocole réseau.
2. Dans `MiningSystem`, émettre ces messages lors du changement d'état.
3. Côté client (RemotePlayer), réagir à ces messages en activant/désactivant un effet visuel (ex: un `Line` Three.js entre le vaisseau et la planète).

## Phase 5 : Polissage et Tests
1. Tester l'extraction avec plusieurs types de ressources.
2. Vérifier que la limite de capacité du cargo est respectée.
3. Vérifier la synchronisation visuelle entre deux instances.
