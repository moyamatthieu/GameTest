# Tasks: Feature 005: Camera Follow

**Entrée**: Documents de conception de `/specs/005-camera-follow/`
**Prérequis**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, pas de dépendances)
- **[Story]**: À quelle user story cette tâche appartient (ex: US1, US2, US3)
- Inclure les chemins de fichiers exacts dans les descriptions

---

## Phase 1: Setup (Infrastructure Partagée)

**Objectif**: Initialisation de la structure de base et des types.

- [x] T001 [P] Mettre à jour `src/core/renderer/types.ts` avec les enums `CameraMode` et l'interface `CameraConfig`
- [x] T002 [P] Créer le fichier de test `tests/unit/core/renderer/CameraController.test.ts` avec une structure de base

---

## Phase 2: Foundational (Prérequis Bloquants)

**Objectif**: Infrastructure de base qui DOIT être terminée avant toute implémentation de user story.

**⚠️ CRITIQUE**: Aucun travail sur les user stories ne peut commencer tant que cette phase n'est pas terminée.

- [x] T003 Définir l'interface `ICameraController` dans `src/core/renderer/CameraController.ts`
- [x] T004 [P] Intégrer `CameraController` dans la classe `Renderer` dans `src/core/renderer/Renderer.ts`
- [x] T005 Mettre à jour la boucle principale dans `src/main.ts` pour appeler `renderer.cameraController.update(deltaTime)`

**Point de contrôle**: Fondation prête - l'implémentation des user stories peut maintenant commencer.

---

## Phase 3: User Story 1 - Suivi fluide en vue poursuite (Chase Cam) (Priorité: P1) 🎯 MVP

**Objectif**: La caméra suit le vaisseau depuis l'arrière avec une interpolation fluide.

**Test Indépendant**: Déplacer le vaisseau et vérifier que la caméra maintient une position relative stable avec un léger retard fluide (lerp).

### Tests pour User Story 1

- [x] T006 [P] [US1] Créer le test unitaire pour le mode Chase dans `tests/unit/core/renderer/CameraController.test.ts`

### Implémentation pour User Story 1

- [x] T007 [US1] Implémenter la logique de calcul de position `CHASE` avec `Vector3.lerp` dans `src/core/renderer/CameraController.ts`
- [x] T008 [US1] Configurer les offsets par défaut (distance, hauteur) dans `CameraController.ts`
- [x] T009 [US1] S'assurer que la caméra regarde toujours vers la cible (Look-at) dans `src/core/renderer/CameraController.ts`

**Point de contrôle**: À ce stade, la User Story 1 doit être pleinement fonctionnelle et testable indépendamment.

---

## Phase 4: User Story 2 - Changement de mode de caméra (Priorité: P2)

**Objectif**: Permettre au joueur de basculer entre les modes (Chase, Cockpit, Orbit) via une touche.

**Test Indépendant**: Appuyer sur la touche 'C' et vérifier que le mode de caméra change.

### Implémentation pour User Story 2

- [x] T010 [US2] Implémenter la méthode `cycleMode()` dans `src/core/renderer/CameraController.ts`
- [x] T011 [US2] Ajouter l'écouteur de touche 'C' dans `src/ui/input/MovementController.ts` pour appeler `cycleMode()`
- [x] T012 [US2] Ajouter une notification visuelle simple (console ou UI) lors du changement de mode

**Point de contrôle**: Les User Stories 1 et 2 fonctionnent indépendamment.

---

## Phase 5: User Story 3 - Vue Cockpit (Priorité: P2)

**Objectif**: Vue fixe depuis l'intérieur du vaisseau pour une immersion maximale.

**Test Indépendant**: Activer le mode Cockpit et vérifier que la caméra est fixée au point d'ancrage du cockpit sans délai.

### Tests pour User Story 3

- [x] T013 [P] [US3] Créer le test unitaire pour le mode Cockpit dans `tests/unit/core/renderer/CameraController.test.ts`

### Implémentation pour User Story 3

- [x] T014 [US3] Implémenter la logique de positionnement `COCKPIT` (position/rotation exacte de la cible) dans `src/core/renderer/CameraController.ts`
- [x] T015 [US3] Définir le point d'ancrage du cockpit dans les paramètres de la cible

---

## Phase 6: User Story 4 - Vue Orbite (Priorité: P3)

**Objectif**: Faire pivoter la caméra autour du vaisseau via les entrées souris.

**Test Indépendant**: Activer le mode Orbite et utiliser la souris pour tourner autour du vaisseau.

### Tests pour User Story 4

- [x] T016 [P] [US4] Créer le test unitaire pour le mode Orbite dans `tests/unit/core/renderer/CameraController.test.ts`

### Implémentation pour User Story 4

- [x] T017 [US4] Implémenter la logique de calcul de position sphérique (theta, phi) pour le mode `ORBIT` dans `src/core/renderer/CameraController.ts`
- [x] T018 [US4] Implémenter `handleMouseMove(deltaX, deltaY)` dans `src/core/renderer/CameraController.ts`
- [x] T019 [US4] Connecter les deltas de souris de `src/ui/input/MovementController.ts` vers `CameraController.handleMouseMove`

---

## Phase 7: Polissage & Questions Transverses

**Objectif**: Améliorations affectant plusieurs user stories.

- [x] T020 [P] Mettre à jour `specs/005-camera-follow/quickstart.md` avec les instructions finales
- [x] T021 Optimiser les performances de calcul (SC-001) pour éviter tout jitter
- [x] T022 [P] Ajouter des tests unitaires supplémentaires pour les cas limites (téléportation) dans `tests/unit/core/renderer/CameraController.test.ts`
- [x] T023 Valider le critère SC-002 (changement de mode < 100ms)

---

## Dépendances & Ordre d'Exécution

### Dépendances de Phase

- **Setup (Phase 1)**: Aucune dépendance - peut commencer immédiatement.
- **Foundational (Phase 2)**: Dépend de la fin du Setup - BLOQUE toutes les user stories.
- **User Stories (Phase 3+)**: Dépendent toutes de la fin de la phase Foundational.
  - Les user stories peuvent ensuite progresser en parallèle ou séquentiellement par priorité (P1 → P2 → P3).
- **Polissage (Phase Finale)**: Dépend de la complétion de toutes les user stories souhaitées.

### Dépendances de User Story

- **User Story 1 (P1)**: Peut commencer après la Phase 2.
- **User Story 2 (P2)**: Peut commencer après la Phase 2. Nécessite US1 pour être utile mais techniquement indépendante.
- **User Story 3 (P2)**: Peut commencer après la Phase 2.
- **User Story 4 (P3)**: Peut commencer après la Phase 2.

### Opportunités de Parallélisation

- T001 et T002 peuvent être faits en même temps.
- T004 et T005 peuvent être faits en parallèle une fois T003 terminé.
- Une fois la Phase 2 terminée, les tests (T006, T013, T016) peuvent être écrits en parallèle.
- Les implémentations de US1, US3 et US4 peuvent être faites par différents développeurs simultanément.

---

## Exemple Parallèle: User Story 1

```bash
# Lancer les tests et les modèles pour US1 ensemble :
Tâche: "Créer le test unitaire pour le mode Chase dans tests/unit/core/renderer/CameraController.test.ts"
Tâche: "Implémenter la logique de calcul de position CHASE dans src/core/renderer/CameraController.ts"
```

---

## Stratégie d'Implémentation

### MVP d'abord (User Story 1 uniquement)

1. Terminer Phase 1: Setup
2. Terminer Phase 2: Foundational (CRITIQUE)
3. Terminer Phase 3: User Story 1
4. **STOP et VALIDER**: Tester la User Story 1 indépendamment.

### Livraison Incrémentale

1. Ajouter User Story 2 (Changement de mode) -> Tester.
2. Ajouter User Story 3 (Cockpit) -> Tester.
3. Ajouter User Story 4 (Orbite) -> Tester.
4. Chaque story apporte de la valeur sans casser les précédentes.
