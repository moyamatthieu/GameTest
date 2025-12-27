# Tâches : Extraction de Ressources et Cargo

- [ ] **Tâche 1 : Définition des données**
  - [ ] Créer `src/core/world/resources.ts` avec l'énumération des 10 ressources.
  - [ ] Créer les composants `ResourceComponent`, `CargoComponent`, `MiningStateComponent`.
  - [ ] Mettre à jour `WorldGenerator` pour assigner des ressources aux planètes.

- [ ] **Tâche 2 : Système de Minage**
  - [ ] Créer `src/ecs/systems/MiningSystem.ts`.
  - [ ] Implémenter la détection de proximité.
  - [ ] Implémenter la boucle d'extraction (update du cargo).

- [ ] **Tâche 3 : Input et UI**
  - [ ] Mapper la touche 'G' dans le gestionnaire d'input.
  - [ ] Créer le composant UI `CargoHUD`.
  - [ ] Ajouter des notifications "Cargo Plein" ou "Hors de portée".

- [ ] **Tâche 4 : Réseau et Visuels**
  - [ ] Ajouter les types de messages dans `contracts.ts`.
  - [ ] Synchroniser l'état de minage via `ConnectionManager`.
  - [ ] Créer l'effet visuel de rayon de minage dans le `Renderer`.

- [ ] **Tâche 5 : Validation**
  - [ ] Écrire des tests unitaires pour `MiningSystem`.
  - [ ] Tester en multi-joueurs local.
