# Feature Specification: Synchronisation d'État P2P

**Feature Branch**: `003-p2p-state-sync`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "Synchronisation de l'état (position, rotation) des vaisseaux entre les pairs via PeerJS"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Diffusion de mon État (Priority: P1)

En tant que joueur, je veux que la position et la rotation de mon vaisseau soient envoyées automatiquement à tous les pairs connectés, afin qu'ils puissent me voir bouger dans leur univers.

**Why this priority**: C'est la base de l'interaction multijoueur. Sans diffusion d'état, le jeu reste une expérience solo isolée.

**Independent Test**: L'utilisateur A bouge son vaisseau (ou il tourne automatiquement). On vérifie dans la console que des messages de type `STATE_UPDATE` sont envoyés via PeerJS.

**Acceptance Scenarios**:

1. **Given** je suis connecté à au moins un pair, **When** mon vaisseau change de position ou rotation, **Then** un message contenant mon `peerId`, ma position et ma rotation est envoyé.
2. **Given** la boucle de jeu tourne, **When** l'intervalle de synchronisation est atteint (ex: 100ms), **Then** l'état actuel est diffusé.

---

### User Story 2 - Rendu des Vaisseaux Distants (Priority: P1)

En tant que joueur, je veux voir les vaisseaux des autres joueurs apparaître et bouger dans ma scène 3D en fonction des données reçues, afin de percevoir leur présence.

**Why this priority**: Complète la boucle de synchronisation. Permet de visualiser les autres joueurs.

**Independent Test**: Deux instances sont ouvertes. L'utilisateur A se connecte à B. Un deuxième vaisseau apparaît dans la scène de B à la position envoyée par A.

**Acceptance Scenarios**:

1. **Given** je reçois un message `STATE_UPDATE` d'un nouveau `peerId`, **When** le message est traité, **Then** un nouveau vaisseau est créé dans ma scène à la position indiquée.
2. **Given** un vaisseau distant existe déjà, **When** je reçois une mise à jour de son état, **Then** sa position et sa rotation sont mises à jour dans ma scène.

---

### User Story 3 - Gestion des Déconnexions (Priority: P2)

En tant que joueur, je veux que les vaisseaux des joueurs qui se déconnectent disparaissent de ma scène, afin de garder un univers cohérent.

**Why this priority**: Évite d'avoir des "vaisseaux fantômes" qui restent immobiles après le départ d'un joueur.

**Independent Test**: L'utilisateur A ferme son navigateur. Le vaisseau de A disparaît de la scène de l'utilisateur B après quelques secondes.

**Acceptance Scenarios**:

1. **Given** un pair se déconnecte proprement (close connection), **When** l'événement est reçu, **Then** son vaisseau est supprimé de la scène.
2. **Given** un pair ne donne plus de nouvelles (timeout), **When** le délai d'expiration est dépassé, **Then** son vaisseau est supprimé.

---

### Edge Cases

- **Latence réseau** : Les vaisseaux peuvent sembler se téléporter. (Note: L'interpolation sera traitée dans une feature ultérieure ou comme amélioration de celle-ci).
- **Désynchronisation massive** : Si trop de messages sont perdus, l'état doit se corriger au prochain message valide.
- **Conflit d'ID** : S'assurer que l'ID du vaisseau correspond exactement au `peerId`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT définir un nouveau type de message `STATE_UPDATE` dans les contrats P2P.
- **FR-002**: Le système DOIT extraire la position (x, y, z) et la rotation (x, y, z, w ou euler) du vaisseau local à intervalle régulier.
- **FR-003**: Le système DOIT envoyer ces données à tous les pairs actifs via `ConnectionManager`.
- **FR-004**: Le système DOIT maintenir un registre des vaisseaux distants (`Map<peerId, Object3D>`).
- **FR-005**: Le système DOIT instancier un vaisseau via `PrimitiveFactory` pour chaque nouveau pair détecté.
- **FR-006**: Le système DOIT mettre à jour les propriétés de transformation des objets Three.js lors de la réception des données.
- **FR-007**: Le système DOIT supprimer l'objet 3D lorsqu'un pair est marqué comme déconnecté.

### Key Entities *(include if feature involves data)*

- **GameStateManager** : Gère l'état global du jeu (local + distants).
- **SyncService** : Orchestre l'envoi et la réception des mises à jour d'état.
- **RemotePlayer** : Représentation d'un joueur distant (données + objet 3D).

## Success Criteria

- La position d'un pair est mise à jour dans la scène locale moins de 200ms après son envoi (hors latence réseau).
- Le système supporte au moins 10 pairs simultanés sans chute de FPS notable.
- Les vaisseaux distants sont visuellement identiques au vaisseau local (même structure de primitives).
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
