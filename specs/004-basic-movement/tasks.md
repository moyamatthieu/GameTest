# Tasks: Feature 004 - Contrôles de Mouvement de Base

**Input**: Documents de conception de `specs/004-basic-movement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Inclus selon le plan de test défini dans `spec.md` et `plan.md`.

**Organisation**: Les tâches sont groupées par User Story pour permettre une implémentation et des tests indépendants.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut être exécuté en parallèle (fichiers différents, pas de dépendances)
- **[Story]**: À quelle User Story cette tâche appartient (ex: US1, US2, US3)
- Les chemins de fichiers exacts sont inclus dans les descriptions.

---

## Phase 1: Configuration (Infrastructure Partagée)

**Objectif**: Initialisation de la structure et des types de base.

- [x] T001 Créer la structure des dossiers `src/core/physics/`, `src/ui/input/` et `tests/unit/core/physics/`
- [x] T002 [P] Définir les types pour `InputState` et `PhysicsComponent` dans `src/core/physics/types.ts`

---

## Phase 2: Fondations (Prérequis Bloquants)

**Objectif**: Infrastructure centrale nécessaire avant l'implémentation des User Stories.

**⚠️ CRITICAL**: Aucune User Story ne peut commencer avant la fin de cette phase.

- [x] T003 Implémenter `MovementController` pour la capture des entrées clavier (W,S,A,D,Q,E,R,F,Space,Shift) dans `src/ui/input/MovementController.ts`
- [x] T004 Créer le composant ECS `PhysicsComponent` dans `src/ecs/components/PhysicsComponent.ts`
- [x] T005 [P] Créer l'interface `IPhysicsEngine` et le squelette de `PhysicsEngine` dans `src/core/physics/PhysicsEngine.ts`
- [x] T006 Créer le système ECS `MovementSystem` dans `src/ecs/systems/MovementSystem.ts`

**Checkpoint**: Fondations prêtes - l'implémentation des User Stories peut commencer.

---

## Phase 3: User Story 1 - Propulsion Linéaire (Priorité: P1) 🎯 MVP

**Objectif**: Permettre au vaisseau d'avancer et de reculer (W/S).

**Test Indépendant**: Appuyer sur 'W' augmente la vitesse vers l'avant. Relâcher 'W' laisse le vaisseau continuer sur son inertie.

### Tests pour User Story 1

- [x] T007 [P] [US1] Écrire les tests unitaires pour la propulsion linéaire (accélération, traînée, vitesse max) dans `tests/unit/core/physics/PhysicsEngine.test.ts`

### Implémentation pour User Story 1

- [x] T008 [US1] Implémenter la logique de calcul de force linéaire dans `src/core/physics/PhysicsEngine.ts`
- [x] T009 [US1] Mettre à jour `MovementSystem` pour appliquer la vélocité linéaire à la position de l'entité dans `src/ecs/systems/MovementSystem.ts`
- [x] T010 [US1] Intégrer la mise à jour de la position avec le `SceneManager` pour le rendu visuel

**Checkpoint**: La propulsion linéaire est fonctionnelle et testable indépendamment.

---

## Phase 4: User Story 2 - Orientation 3D (Priorité: P1)

**Objectif**: Permettre l'orientation sur les 3 axes (Lacet, Tangage, Roulis).

**Test Indépendant**: Utiliser A/D (Lacet), R/F (Tangage) et Q/E (Roulis) pour pivoter le vaisseau.

### Tests pour User Story 2

- [x] T011 [P] [US2] Écrire les tests unitaires pour les rotations 6DOF (Quaternions, vitesse angulaire) dans `tests/unit/core/physics/PhysicsEngine.test.ts`

### Implémentation pour User Story 2

- [x] T012 [US2] Implémenter la logique de rotation 6DOF dans `src/core/physics/PhysicsEngine.ts`
- [x] T013 [US2] Mettre à jour `MovementSystem` pour appliquer la vélocité angulaire à la rotation de l'entité dans `src/ecs/systems/MovementSystem.ts`
- [x] T014 [US2] Intégrer la mise à jour de la rotation avec le `SceneManager` pour le rendu visuel

**Checkpoint**: L'orientation 3D est fonctionnelle et testable indépendamment.

---

## Phase 5: User Story 3 - Manœuvres Avancées : Frein et Turbo (Priorité: P2)

**Objectif**: Ajouter les fonctionnalités de freinage d'urgence et de turbo.

**Test Indépendant**: Maintenir 'Espace' pour s'arrêter rapidement. Maintenir 'Shift' pour une accélération accrue.

### Tests pour User Story 3

- [x] T015 [P] [US3] Écrire les tests unitaires pour le freinage (drag accru) et le turbo (thrust accru) dans `tests/unit/core/physics/PhysicsEngine.test.ts`

### Implémentation pour User Story 3

- [x] T016 [US3] Implémenter la logique de freinage dans `src/core/physics/PhysicsEngine.ts`
- [x] T017 [US3] Implémenter la logique de turbo dans `src/core/physics/PhysicsEngine.ts`
- [x] T018 [US3] Mettre à jour `MovementSystem` pour traiter les entrées de freinage et de turbo

**Checkpoint**: Toutes les User Stories sont fonctionnelles indépendamment.

---

## Phase 6: Polissage et Transversal

**Objectif**: Améliorations globales et intégration finale.

- [x] T019 [P] Implémenter `MovementSync` pour la réplication réseau du mouvement via `SyncService` dans `src/core/sync/MovementSync.ts`
- [x] T020 [P] Mettre à jour la documentation technique dans `specs/004-basic-movement/quickstart.md`
- [x] T021 Effectuer les tests d'intégration finaux entre ECS, Physique et Rendu

---

## Dépendances et Ordre d'Exécution

### Dépendances de Phase

- **Configuration (Phase 1)**: Aucune dépendance - peut commencer immédiatement.
- **Fondations (Phase 2)**: Dépend de la Phase 1 - BLOQUE toutes les User Stories.
- **User Stories (Phase 3+)**: Dépendent de la Phase 2.
  - Peuvent être réalisées en parallèle ou séquentiellement (P1 → P2).
- **Polissage (Phase Finale)**: Dépend de la complétion des User Stories souhaitées.

### Opportunités de Parallélisation

- Les tâches marquées [P] peuvent être réalisées en parallèle.
- Une fois les Fondations (Phase 2) terminées, US1 et US2 peuvent être développées en parallèle.
- Les tests unitaires de chaque story peuvent être écrits en parallèle de la définition des types.

---

## Exemple de Parallélisation : User Story 1

```bash
# Lancer les tests et la structure en même temps :
Tâche: "Écrire les tests unitaires pour la propulsion linéaire dans tests/unit/core/physics/PhysicsEngine.test.ts"
Tâche: "Définir les types pour InputState et PhysicsComponent dans src/core/physics/types.ts"
```

---

## Stratégie d'Implémentation

### MVP d'abord (User Story 1 uniquement)

1. Compléter Phase 1 & 2.
2. Compléter Phase 3 (US1).
3. **VALIDER**: Tester la propulsion linéaire indépendamment.

### Livraison Incrémentale

1. Fondations prêtes.
2. Ajout US1 → Test → Démo (MVP).
3. Ajout US2 → Test → Démo.
4. Ajout US3 → Test → Démo.
