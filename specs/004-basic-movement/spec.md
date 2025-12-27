# Feature Specification: Contrôles de Mouvement de Base

**Feature Branch**: `004-basic-movement`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "Feature 004: Basic Movement Controls. Allow player to control ship using WASD/Space/Shift. W/S: Thrust, A/D: Yaw, Q/E: Roll, R/F: Pitch, Space: Brake, Shift: Turbo. Physics-based. Integrate with SceneManager and SyncService. Follow Constitution v2.2.0. Language: French."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Propulsion Linéaire (Priority: P1)

En tant que pilote, je veux pouvoir accélérer et décélérer mon vaisseau en utilisant les touches W et S, afin de me déplacer dans l'espace.

**Why this priority**: Le mouvement de base est essentiel pour explorer l'univers et interagir avec les autres joueurs.

**Independent Test**: Appuyer sur 'W' augmente la vitesse vers l'avant. Relâcher 'W' laisse le vaisseau continuer sur son inertie (avec une légère traînée). Appuyer sur 'S' réduit la vitesse ou fait reculer le vaisseau.

**Acceptance Scenarios**:

1. **Given** le vaisseau est à l'arrêt, **When** j'appuie sur 'W', **Then** la vitesse linéaire augmente progressivement jusqu'à une limite maximale.
2. **Given** le vaisseau est en mouvement, **When** je relâche toutes les touches, **Then** le vaisseau ralentit très lentement à cause de la traînée spatiale.

---

### User Story 2 - Orientation 3D (Priority: P1)

En tant que pilote, je veux pouvoir orienter mon vaisseau sur les trois axes (Lacet, Tangage, Roulis) pour naviguer avec précision.

**Why this priority**: La navigation spatiale nécessite une liberté de mouvement totale sur 6 degrés de liberté (6DOF).

**Independent Test**: Utiliser A/D pour tourner à gauche/droite (Lacet), R/F pour monter/descendre (Tangage) et Q/E pour s'incliner (Roulis).

**Acceptance Scenarios**:

1. **Given** le vaisseau est stable, **When** j'appuie sur 'A', **Then** le vaisseau pivote sur son axe vertical (Y) vers la gauche.
2. **Given** le vaisseau est stable, **When** j'appuie sur 'R', **Then** le nez du vaisseau s'élève (axe X).
3. **Given** le vaisseau est stable, **When** j'appuie sur 'Q', **Then** le vaisseau s'incline sur son axe longitudinal (Z).

---

### User Story 3 - Manœuvres Avancées : Frein et Turbo (Priority: P2)

En tant que pilote, je veux pouvoir freiner brusquement pour éviter des obstacles ou utiliser un turbo pour m'échapper rapidement.

**Why this priority**: Ajoute de la profondeur au gameplay et permet une meilleure réactivité lors des phases de vol intenses.

**Independent Test**: Maintenir 'Espace' pour s'arrêter. Maintenir 'Shift' pour accélérer plus vite.

**Acceptance Scenarios**:

1. **Given** le vaisseau a une vitesse élevée, **When** je maintiens 'Espace', **Then** le vaisseau s'arrête significativement plus vite que par la simple traînée.
2. **Given** le vaisseau avance, **When** je maintiens 'Shift', **Then** l'accélération et la vitesse maximale sont augmentées temporairement.

---

### Edge Cases

- **Vitesse infinie** : Le système doit plafonner la vitesse maximale pour éviter les bugs de collision et de rendu.
- **Accumulation de rotation** : Les rotations ne doivent pas s'accumuler indéfiniment pour éviter que le vaisseau ne devienne incontrôlable (limitation de la vitesse angulaire).
- **Conflit d'inputs** : Si 'W' et 'S' sont pressés simultanément, les forces doivent s'annuler ou l'une doit être prioritaire.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT capturer les entrées clavier de manière non-bloquante (polling dans la boucle de jeu).
- **FR-002**: Le mouvement DOIT être basé sur la physique : application de forces (accélération) et calcul de la vélocité.
- **FR-003**: Le système DOIT appliquer une traînée (drag) linéaire et angulaire pour simuler une résistance et stabiliser le vol.
- **FR-004**: Le système DOIT limiter la vitesse linéaire et angulaire maximale.
- **FR-005**: La touche 'Espace' DOIT multiplier temporairement le coefficient de traînée pour simuler un freinage actif.
- **FR-006**: La touche 'Shift' DOIT multiplier la force de poussée appliquée.
- **FR-007**: Les transformations (position/rotation) DOIVENT être appliquées à l'objet 3D du joueur via le `SceneManager`.
- **FR-008**: L'état de mouvement (vélocité, accélération) DOIT être stocké dans des composants ECS (ex: `PhysicsComponent`).
- **FR-009**: Le système DOIT être compatible avec `SyncService` pour permettre la réplication du mouvement vers les autres pairs.

### Key Entities *(include if feature involves data)*

- **InputState**: Structure de données stockant l'état actuel des touches de contrôle.
- **PhysicsComponent**: Composant attaché à l'entité du vaisseau contenant la vélocité, l'accélération et les constantes physiques (masse, drag).
- **MovementSystem**: Système ECS traitant les inputs et mettant à jour le `PhysicsComponent` et la `Transform`.

## Success Criteria

- **SC-001**: Le vaisseau atteint sa vitesse maximale en moins de 5 secondes de poussée continue.
- **SC-002**: Le freinage complet depuis la vitesse maximale s'effectue en moins de 3 secondes.
- **SC-003**: La rotation de 360 degrés sur n'importe quel axe prend entre 2 et 4 secondes (équilibrage).
- **SC-004**: Le mouvement est fluide à 60 FPS sans saccades liées aux calculs physiques.
- **SC-005**: La position du vaisseau est synchronisée avec les pairs avec une erreur visuelle minimale (testé via `SyncService`).

## Assumptions

- Le modèle physique est simplifié (pas de calcul de centre de masse complexe ou de distribution de propulseurs).
- Le `SceneManager` expose une méthode pour mettre à jour la position/rotation de l'objet local.
- La Constitution v2.2.0 impose que la logique de mouvement soit dans un système ECS (`MovementSystem`).
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
