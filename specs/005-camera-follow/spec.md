# Feature Specification: Suivi de caméra pour le vaisseau du joueur

**Feature Branch**: `005-camera-follow`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "Create a feature specification for Feature 005: Camera Follow. The goal is to have the camera follow the player ship in a 3rd person view. Smooth follow (interpolation/lerp). Look-at the ship. Support for different camera modes (Chase, Cockpit, Orbit). Integration with Renderer and main.ts. Language: French."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Suivi fluide en vue poursuite (Chase Cam) (Priority: P1)

En tant que pilote, je veux que la caméra suive mon vaisseau de manière fluide depuis l'arrière afin de garder une bonne visibilité sur mon environnement tout en ressentant l'inertie du mouvement.

**Why this priority**: C'est le mode de vue principal pour le gameplay de vol et de combat. Sans cela, le joueur perd de vue son propre vaisseau.

**Independent Test**: Peut être testé en déplaçant le vaisseau et en vérifiant que la caméra maintient une position relative stable avec un léger retard fluide (lerp).

**Acceptance Scenarios**:

1. **Given** le vaisseau est à l'arrêt, **When** le vaisseau accélère, **Then** la caméra suit le mouvement avec une transition fluide.
2. **Given** le vaisseau tourne, **When** la caméra se repositionne, **Then** elle reste orientée vers l'arrière du vaisseau tout en regardant vers l'avant.

---

### User Story 2 - Changement de mode de caméra (Priority: P2)

En tant que joueur, je veux pouvoir changer de point de vue (Poursuite, Cockpit, Orbite) pour adapter ma vision à la situation (navigation, combat, observation).

**Why this priority**: Améliore l'immersion et offre des options tactiques différentes.

**Independent Test**: Appuyer sur une touche dédiée et vérifier que le comportement de la caméra change immédiatement selon le mode sélectionné.

**Acceptance Scenarios**:

1. **Given** la caméra est en mode Poursuite, **When** le joueur appuie sur la touche de changement de vue, **Then** la caméra passe en mode Cockpit.
2. **Given** la caméra est en mode Cockpit, **When** le joueur appuie sur la touche de changement de vue, **Then** la caméra passe en mode Orbite.

---

### User Story 3 - Vue Cockpit (Priority: P2)

En tant que pilote, je veux voir l'espace depuis l'intérieur de mon vaisseau pour une immersion maximale.

**Why this priority**: Essentiel pour l'immersion dans un jeu de simulation spatiale.

**Independent Test**: Activer le mode Cockpit et vérifier que la caméra est positionnée à l'emplacement exact du cockpit du vaisseau et suit ses rotations sans délai.

**Acceptance Scenarios**:

1. **Given** le mode Cockpit est actif, **When** le vaisseau effectue un tonneau, **Then** la caméra effectue la même rotation sans aucune interpolation de retard.

---

### User Story 4 - Vue Orbite (Priority: P3)

En tant que joueur, je veux pouvoir faire tourner la caméra autour de mon vaisseau pour l'admirer ou inspecter les environs sans changer la direction du vol.

**Why this priority**: Fonctionnalité esthétique et de confort pour l'observation.

**Independent Test**: Activer le mode Orbite et utiliser la souris/joystick pour faire pivoter la vue autour du vaisseau immobile ou en mouvement.

**Acceptance Scenarios**:

1. **Given** le mode Orbite est actif, **When** le joueur déplace la souris, **Then** la caméra tourne autour du centre du vaisseau.

---

### Edge Cases

- **Collision avec des objets**: Que se passe-t-il si un obstacle se trouve entre la caméra et le vaisseau ? (Pour cette V1, on ignorera les collisions).
- **Vitesse extrême**: Comment se comporte l'interpolation à très haute vitesse ? (La caméra doit rester à une distance raisonnable).
- **Téléportation**: Si le vaisseau est téléporté, la caméra doit-elle "lerper" sur une longue distance ou se téléporter aussi ? (Elle doit se téléporter instantanément).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre à la caméra de suivre la position 3D du vaisseau du joueur.
- **FR-002**: Le système DOIT implémenter une interpolation (lerp/slerp) pour le mouvement de la caméra en mode Poursuite afin d'assurer la fluidité.
- **FR-003**: La caméra DOIT être orientée vers le vaisseau (Look-at) ou suivre son vecteur directionnel selon le mode.
- **FR-004**: Le système DOIT supporter trois modes distincts :
    - **Chase (Poursuite)** : Caméra derrière le vaisseau avec interpolation.
    - **Cockpit** : Caméra fixée à la position du pilote, sans interpolation de retard.
    - **Orbit (Orbite)** : Caméra pivotant autour du vaisseau via les entrées utilisateur.
- **FR-005**: Le système DOIT permettre le basculement entre les modes via une entrée clavier (ex: touche 'C').
- **FR-006**: Le système DOIT être intégré dans la boucle de rendu principale (`Renderer`) et mis à jour à chaque frame dans `main.ts`.

### Key Entities

- **Caméra**: L'entité gérant la projection et la vue.
- **Cible (Vaisseau)**: L'entité physique dont la position et l'orientation servent de référence.
- **Contrôleur de Caméra**: Le module logique qui calcule la nouvelle position/rotation de la caméra en fonction du mode actif et de la cible.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le suivi de la caméra en mode Poursuite ne présente aucun tremblement (jitter) visuel perceptible à 60 FPS.
- **SC-002**: Le passage entre les modes de caméra s'effectue en moins de 100ms après l'entrée utilisateur.
- **SC-003**: En mode Cockpit, la caméra maintient une position relative fixe par rapport au vaisseau avec une erreur de moins de 0.01 unité.
- **SC-004**: L'utilisateur peut effectuer une rotation complète de 360 degrés autour du vaisseau en mode Orbite sans blocage de l'angle (gimbal lock).

## Assumptions

- Le vaisseau possède un point d'ancrage défini pour le cockpit.
- Les entrées utilisateur pour le mode Orbite sont disponibles via le système d'input existant.
- La fluidité de l'interpolation est configurable via des paramètres de "smoothness".
