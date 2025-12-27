# Feature Specification: Serveur de Persistance de Secours + Hébergement

**Feature Branch**: `001-p2p-persistence-server`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "Ajouter un petit serveur non-autoritaire pour servir les fichiers du jeu au navigateur et assurer une persistance de secours (snapshots/journal signé) en cas de perte de tous les nœuds P2P PeerJS."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Charger le jeu depuis le serveur (Priority: P1)

En tant que joueur, je peux ouvrir une URL et charger le client du jeu dans mon navigateur, parce que le serveur fournit les fichiers nécessaires (HTML/CSS/JS/assets) même si aucun pair P2P n'est disponible.

**Why this priority**: Sans distribution fiable des fichiers, le jeu n'est pas accessible. C'est le minimum pour itérer et tester.

**Independent Test**: Lancer le serveur, ouvrir l'URL dans un navigateur propre (cache vidé), constater que l'application se charge et affiche l'état réseau (connecté / en attente / hors-ligne) sans planter.

**Acceptance Scenarios**:

1. **Given** le serveur est démarré et expose l'application, **When** un joueur visite l'URL du jeu, **Then** la page se charge et le jeu démarre sans erreur bloquante.
2. **Given** aucun pair P2P n'est joignable, **When** le jeu démarre, **Then** l'UI indique clairement l'état "en attente"/"hors-ligne" et le jeu reste utilisable (au moins pour l'écran d'accueil ou un mode local).

---

### User Story 2 - Sauvegarde de secours signée (Priority: P2)

En tant que joueur, mon jeu peut envoyer périodiquement au serveur une persistance de secours (snapshot et/ou journal d'événements) signée par mon identité, afin que l'univers puisse être restauré si tous les pairs disparaissent.

**Why this priority**: C'est la valeur principale demandée: survivre à une extinction totale des nœuds P2P.

**Independent Test**: Démarrer le serveur, simuler un client qui publie un snapshot signé, puis récupérer ce snapshot via une lecture et vérifier qu'il est identique et vérifiable.

**Acceptance Scenarios**:

1. **Given** un client possède une identité cryptographique et un état de jeu, **When** il publie une persistance de secours signée, **Then** le serveur l'accepte et renvoie un accusé de réception (avec un identifiant et un horodatage).
2. **Given** une requête de persistance est non signée ou invalide, **When** elle est envoyée, **Then** le serveur la refuse et n'enregistre aucune donnée.

---

### User Story 3 - Restauration après extinction totale P2P (Priority: P3)

En tant que joueur, si aucun pair P2P n'est disponible (perte de tous les nœuds), je peux restaurer le jeu depuis la dernière persistance de secours stockée sur le serveur et reprendre une partie cohérente.

**Why this priority**: Finalise le filet de sécurité: sans restauration, la persistance seule ne sert pas l'expérience utilisateur.

**Independent Test**: Publier un snapshot, arrêter toute connectivité P2P (ou simuler "0 pairs"), redémarrer un client vierge, déclencher une restauration et vérifier que l'état correspond au snapshot.

**Acceptance Scenarios**:

1. **Given** le serveur possède au moins un snapshot valide pour un monde/cluster, **When** un client démarre sans pairs P2P et demande une restauration, **Then** le serveur fournit le dernier snapshot valide et le client peut l'appliquer après vérification.
2. **Given** le serveur ne possède aucun snapshot valide, **When** un client demande une restauration, **Then** le serveur répond clairement "aucune donnée" et le client reste dans un état utilisable (nouvelle partie / attente / mode local), sans corruption.

---

### Edge Cases

- Le serveur est indisponible (réseau coupé) lors d'une tentative de sauvegarde.
- Un snapshot est trop volumineux ou dépasse les limites de taille.
- Une persistance est corrompue (contenu illisible) ou ne passe pas la vérification (signature/digest).
- Deux clients publient en concurrence pour le même monde/cluster.
- Tentatives de replay (réinjecter un ancien snapshot comme s'il était récent).
- Horloges clients désynchronisées (timestamps incohérents).
- Un acteur malveillant tente de spammer le serveur (flood) ou de publier sous une autre identité.

## Scope, Assumptions & Dependencies

### In Scope

- Servir le client web du jeu au navigateur (hébergement de fichiers statiques).
- Persistance de secours non-autoritaire (stockage + restitution) via snapshots et/ou journal append-only signé.
- Restauration côté client quand aucun pair P2P n'est joignable.

### Out of Scope

- Construire "tout le MMO RTS" (économie, combat complet, IA, matchmaking, etc.).
- Remplacer l'architecture P2P par un serveur autoritaire.

### Assumptions / Dependencies

- Le client possède déjà une identité cryptographique utilisable pour signer des payloads.
- L'état P2P reste la source de vérité quand des pairs/validateurs sont disponibles.
- Le format exact de snapshot/journal sera défini dans la phase de planification (sans changer les exigences fonctionnelles).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT fournir une URL unique permettant de charger le client du jeu depuis un navigateur.
- **FR-002**: Le serveur DOIT servir les fichiers statiques du client (application web) conformément aux critères de performance SC-001.
- **FR-003**: Le serveur DOIT exposer un mécanisme d'écriture de persistance de secours (snapshot et/ou journal append-only).
- **FR-004**: Toute écriture de persistance DOIT être associée à une identité et être vérifiable (signature) avant acceptation.
- **FR-005**: Le serveur DOIT refuser les écritures non signées, mal formées, ou dépassant les limites (taille / fréquence).
- **FR-006**: Le serveur DOIT stocker et permettre de récupérer au minimum "le dernier snapshot valide" par monde/cluster.
- **FR-007**: Le serveur NE DOIT PAS être autoritaire: il ne calcule pas la simulation et ne modifie pas l'état; il stocke et restitue.
- **FR-008**: Le client DOIT pouvoir demander une restauration et vérifier l'authenticité de la donnée reçue avant application.
- **FR-009**: Le système DOIT supporter la coexistence de plusieurs mondes/clusters (données séparées et non mélangeables).
- **FR-010**: Le système DOIT fournir une indication d'état claire côté client (P2P disponible / indisponible, persistance disponible / indisponible).
- **FR-011**: Le système DOIT appliquer une politique de rétention (configurable) afin d'éviter une croissance illimitée des données.
- **FR-012**: Le serveur DOIT exposer un endpoint de santé (health) permettant de diagnostiquer rapidement sa disponibilité.

### Key Entities *(include if feature involves data)*

- **WorldId / ClusterId**: Identifie l'univers / la partition logique à laquelle une persistance appartient.
- **WorldSnapshot**: Capture complète d'un état de jeu à un instant donné (incluant métadonnées: auteur, horodatage, digest).
- **MutationLogEntry**: Événement append-only décrivant une mutation signée (auteur, type, paramètres, référence temporelle).
- **SignedPayload**: Enveloppe qui contient les données + preuve d'authenticité (signature) + informations minimales pour vérifier.
- **StoredArtifact**: Objet stocké par le serveur (snapshot ou entrée de journal) avec un identifiant et une date de réception.
- **RestoreRequest / RestoreResponse**: Demande de restauration et réponse (dernier snapshot valide + métadonnées de vérification).

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Un joueur peut charger le client du jeu depuis l'URL du serveur et arriver sur un état utilisable en moins de 10 secondes (sur une connexion grand public).
- **SC-002**: Après une extinction totale des pairs P2P, un joueur peut restaurer une partie depuis la dernière persistance de secours en moins de 60 secondes.
- **SC-003**: 100% des écritures de persistance non vérifiables (non signées / signature invalide / format invalide) sont rejetées.
- **SC-004**: Le serveur supporte au moins 50 joueurs actifs effectuant une persistance périodique sans erreurs de disponibilité (sur une période de 30 minutes de test).

## Constitution Alignment

- [x] **Top-Down View**: Cette feature n'altère pas la caméra et doit rester compatible Top-Down.
- [x] **RTS Controls**: Cette feature n'altère pas les contrôles et doit rester compatible RTS.
- [x] **P2P Architecture**: La persistance n'est qu'un filet de sécurité; la validation et la simulation restent distribuées.
- [x] **Persistence Fallback Server**: La feature implémente explicitement un stockage/restauration via snapshots/journal signé.
