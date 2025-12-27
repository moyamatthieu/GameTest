# Feature Specification: Connexion P2P de Base (PeerJS)

**Feature Branch**: `001-p2p-peerjs-connection`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "Mettre en place la connexion de base entre deux joueurs via PeerJS avec génération d'ID unique"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Génération d'Identité Unique (Priority: P1)

En tant que nouveau joueur, je veux que le système me génère automatiquement une identité unique basée sur la cryptographie dès ma première connexion, afin que je puisse être identifié de manière sécurisée sur le réseau sans serveur central.

**Why this priority**: C'est la base de toute l'architecture décentralisée définie dans la constitution. Sans ID unique et sécurisé, aucune communication P2P n'est possible.

**Independent Test**: L'utilisateur ouvre l'application et voit un identifiant (Peer ID) s'afficher. Si l'utilisateur rafraîchit la page, le même identifiant doit être conservé (persistance locale).

**Acceptance Scenarios**:

1. **Given** l'application est lancée pour la première fois, **When** le chargement est terminé, **Then** une paire de clés Ed25519 est générée et un Peer ID dérivé est affiché.
2. **Given** une identité a déjà été générée, **When** l'utilisateur revient sur l'application, **Then** le même Peer ID est récupéré depuis le stockage local.

---

### User Story 2 - Connexion à un Pair (Priority: P1)

En tant que joueur, je veux pouvoir entrer l'identifiant d'un autre joueur pour établir une connexion directe avec lui, afin de commencer à interagir dans l'univers partagé.

**Why this priority**: C'est la fonctionnalité coeur du mode multijoueur P2P.

**Independent Test**: Deux instances de l'application sont ouvertes. L'utilisateur A copie son ID. L'utilisateur B colle l'ID de A dans un champ de saisie et clique sur "Connecter". Le statut passe à "Connecté" sur les deux écrans.

**Acceptance Scenarios**:

1. **Given** l'utilisateur B possède l'ID de l'utilisateur A, **When** B initie une connexion vers A, **Then** PeerJS établit un DataChannel WebRTC entre les deux.
2. **Given** une tentative de connexion, **When** l'ID cible est invalide ou hors ligne, **Then** un message d'erreur explicite est affiché.

---

### User Story 3 - Vérification de la Communication (Priority: P2)

En tant que joueur connecté, je veux envoyer un message de test à mon pair pour confirmer que le canal de données fonctionne correctement.

**Why this priority**: Permet de valider que le DataChannel est non seulement ouvert mais aussi fonctionnel pour l'échange de données de jeu futures.

**Independent Test**: Une fois connectés, l'utilisateur A envoie "Hello" via une interface simple. L'utilisateur B voit "Hello" s'afficher instantanément.

**Acceptance Scenarios**:

1. **Given** deux joueurs sont connectés, **When** l'un envoie une chaîne de caractères, **Then** l'autre la reçoit et l'affiche dans une console de log ou une zone de texte.

---

### Edge Cases

- **Perte de connexion internet** : Le système doit détecter la déconnexion de PeerJS et tenter une reconnexion automatique ou informer l'utilisateur.
- **ID en doublon** : Bien que statistiquement improbable avec Ed25519, le système doit gérer les erreurs d'initialisation de PeerJS si l'ID est déjà utilisé sur le serveur de signalement.
- **Navigateur non compatible WebRTC** : Afficher un message d'erreur si le navigateur ne supporte pas les technologies nécessaires.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT générer une paire de clés Ed25519 (via une bibliothèque comme `tweetnacl` ou `noble-curves`) si aucune n'est présente dans le `localStorage`.
- **FR-002**: Le système DOIT dériver le Peer ID à partir de la clé publique (ex: encodage base58 ou hexadécimal).
- **FR-003**: Le système DOIT initialiser une instance `Peer` de PeerJS en utilisant cet ID unique.
- **FR-004**: Le système DOIT utiliser les serveurs de signalement publics de PeerJS par défaut (peerjs.com).
- **FR-005**: L'interface DOIT afficher le Peer ID de l'utilisateur actuel de manière lisible pour permettre le partage.
- **FR-006**: Le système DOIT permettre la saisie d'un Peer ID distant et l'initialisation d'un `peer.connect()`.
- **FR-007**: Le système DOIT écouter les connexions entrantes via `peer.on('connection', ...)` et accepter automatiquement le DataChannel.
- **FR-008**: Le système DOIT fournir un indicateur visuel de l'état de la connexion (Initialisation, En ligne, Connecté à [ID], Erreur).

### Key Entities *(include if feature involves data)*

- **Identity**: Objet contenant la clé privée (secrète), la clé publique et le Peer ID calculé.
- **PeerConnection**: Abstraction autour du `DataConnection` de PeerJS, gérant les événements d'ouverture, de fermeture et de réception de données.

## Success Criteria

- Un utilisateur peut générer son identité unique en moins de 2 secondes au premier lancement.
- La connexion entre deux pairs situés sur des réseaux différents (NAT traversal) réussit dans 90% des cas (limite de WebRTC/STUN).
- La latence pour un message de test "ping-pong" est inférieure à 200ms en conditions normales.
- L'ID reste identique après un redémarrage du navigateur.

## Assumptions

- Nous utilisons la bibliothèque `peerjs` pour la couche WebRTC.
- La sécurité initiale repose sur le fait que seul le possesseur de la clé privée peut s'enregistrer avec son Peer ID (à vérifier si PeerJS permet de prouver la possession de l'ID via signature lors du signalement, sinon c'est une limitation acceptée pour ce prototype).
- Le stockage des clés se fait dans le `localStorage` pour la simplicité du prototype.
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
