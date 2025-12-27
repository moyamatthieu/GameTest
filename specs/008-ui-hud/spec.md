# Feature Specification: UI/HUD

**Feature Branch**: `008-ui-hud`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "Create a specification for Feature 008: UI/HUD. The feature should include: A Health Bar showing the player's current HP. A Crosshair in the center of the screen. A simple 2D Radar (top-right) showing: The player (center), Nearby planets (gray dots), Remote players (red dots). A 'Target Info' panel showing the name and HP of the last hit target. Use Vanilla HTML/CSS for the UI as per the Constitution (Principle VI)."

## User Scenarios & Testing

### User Story 1 - Sélecteur de Vue (Priority: P1)

En tant que joueur, je veux pouvoir changer rapidement de vue (Galaxie, Système, Planète) via des boutons sur l'interface, afin de naviguer efficacement.

**Why this priority**: Élément de navigation critique défini dans la Constitution.

**Independent Test**: L'utilisateur voit trois boutons "Galaxie", "Système", "Planète". Cliquer sur l'un d'eux déclenche la transition de caméra correspondante.

---

### User Story 2 - Affichage des Ressources (Priority: P1)

En tant que gestionnaire, je veux voir mon stock actuel pour les 10 types de ressources, afin de planifier mes constructions et mon commerce.

**Why this priority**: L'économie est au cœur du gameplay.

**Independent Test**: Un panneau affiche les icônes et les quantités pour : Fer, Cuivre, Eau, Hélium-3, Silicium, Uranium, Titane, Terres Rares, Hydrogène, Carbone.

---

### User Story 3 - Radar Tactique 2D (Priority: P2)

En tant qu'explorateur, je veux un radar en haut à droite montrant ma position relative par rapport aux planètes et aux autres joueurs.

**Why this priority**: Permet la navigation et la conscience situationnelle dans l'espace 3D.

**Independent Test**: Un cercle radar est visible en haut à droite. Le joueur est au centre. Les planètes proches apparaissent comme des points gris. Les autres joueurs apparaissent comme des points rouges.

**Acceptance Scenarios**:
1. **Given** des entités (planètes, joueurs) sont à proximité, **When** le radar est affiché, **Then** leurs positions relatives sont projetées sur le plan 2D du radar.
2. **Given** le joueur se déplace, **When** le radar se met à jour, **Then** les points se déplacent en sens inverse pour maintenir le joueur au centre.

---

### User Story 4 - Informations de Cible (Priority: P2)

En tant que combattant, je veux voir le nom et les HP de la dernière cible que j'ai touchée pour évaluer l'efficacité de mes tirs.

**Why this priority**: Fournit un feedback crucial sur l'état de l'ennemi.

**Independent Test**: Le joueur tire sur une cible. Un panneau apparaît montrant "Target: [Nom]" et "HP: [Valeur]".

**Acceptance Scenarios**:
1. **Given** une cible a été touchée, **When** l'événement de hit est reçu, **Then** le panneau "Target Info" s'affiche ou se met à jour avec les données de la cible.

## Requirements

### Functional Requirements

- **FR-001**: L'interface DOIT inclure un panneau de sélection de vue avec trois boutons : "Galaxie", "Système", "Planète".
- **FR-002**: L'interface DOIT afficher les quantités pour les 10 ressources constitutionnelles.
- **FR-003**: L'interface DOIT être construite en Vanilla HTML/CSS, superposée au canvas Three.js.
- **FR-004**: La barre de vie DOIT refléter le composant `HealthComponent` de l'entité sélectionnée.
- **FR-005**: Le radar DOIT afficher les entités dans un rayon défini (ex: 1000 unités).
- **FR-006**: L'UI DOIT être responsive et s'adapter aux changements de taille de la fenêtre.

### Key Entities

- **HUDManager**: Gère l'affichage et la mise à jour des éléments HTML.
- **ViewSelector**: Gère les événements de clic sur les boutons de changement de vue.
- **ResourcePanel**: Affiche les stocks des 10 ressources.
- **RadarSystem**: Calcule les positions relatives pour l'affichage du radar.

## Success Criteria

- La barre de vie se met à jour en moins de 16ms après un changement de HP.
- Le radar affiche correctement jusqu'à 50 entités sans chute de FPS.
- Le réticule est parfaitement centré (vérifié par calcul de coordonnées).
- L'UI est lisible sur des résolutions allant de 1280x720 à 4K.

## Assumptions

- Les données de santé sont disponibles via le `HealthComponent`.
- Les positions des entités sont disponibles via le `LocationComponent`.
- Un système d'événements ou un accès direct au `World` ECS permet de récupérer les données en temps réel.
