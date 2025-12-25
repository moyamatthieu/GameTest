# Galactic Dominion Constitution

## Core Principles

### I. Server-Authoritative Architecture (NON-NEGOTIABLE)
**Le client est stupide. Le serveur est intelligent.**
- ✅ Le client **affiche** l'état du jeu (rendu Three.js uniquement)
- ✅ Le client **capture** les inputs utilisateur (souris, clavier)
- ❌ Le client **ne calcule JAMAIS** de logique métier
- ❌ Le client **ne modifie JAMAIS** les données directement
- Toute logique de jeu DOIT résider dans `common/ecs/systems/` et être exécutée UNIQUEMENT par le serveur
- Le client synchronise l'état via `MeshSync` (lecture seule)

### II. Pure ECS Architecture
**Entities, Components, Systems - Séparation stricte des responsabilités**
- **Entities** : Identifiants numériques simples (pas de logique)
- **Components** : Objets de données purs SANS logique (définis dans `common/ecs/components.ts`)
- **Systems** : TOUTE la logique métier (dans `common/ecs/systems/`)
- Utiliser `world.createEntity()`, `world.addComponent()`, `world.getComponent()`
- Pas de logique dans les composants (uniquement des structures de données)

### III. TypeScript First
**Migration progressive de JavaScript vers TypeScript**
- Nouveau code : TypeScript obligatoire
- Typage fort avec interfaces explicites (`common/types/`)
- Fichiers `.js` existants peuvent être migrés progressivement
- Configuration tsconfig stricte : `strict: true`, `noImplicitAny: true`
- Pas de `any` sauf justification documentée

### IV. Network Protocol & Performance
**Optimisation des communications réseau**
- Protocole : Socket.io avec MessagePack pour sérialisation
- Delta Compression : Envoyer uniquement les champs modifiés
- Interest Management (AOI) : Filtrer les entités selon la position du joueur
- Snapshot Interpolation : Buffer de 100ms pour lisser les mouvements
- Persistance : SQLite avec `DatabaseManager` (voir `server/db/`)

### V. Multi-Scale Architecture
**Trois échelles de simulation distinctes**
- **Macro** (Galactique) : Échelle Parsecs
- **Meso** (Système) : Échelle Unités Astronomiques (AU)
- **Micro** (Planétaire) : Échelle Kilomètres
- Trois instances `THREE.Scene` pour éviter Z-fighting
- Composant `Position` avec `referenceFrame` : 'global', 'planet_surface', 'orbital'

### VI. Minimiser les Dépendances
**Vanilla-first approach**
- JavaScript/TypeScript Vanilla (pas de React, Vue, Angular)
- Three.js pour le rendu 3D
- Socket.io pour le réseau
- SQLite pour la persistance
- Éviter les frameworks lourds
- Préférer les solutions natives quand possible

### VII. Documentation & Patterns
**Maintenir une documentation technique à jour**
- Documenter les changements majeurs dans `ARCHITECTURE.md` et `USAGE_GUIDE.md`
- Suivre les patterns dans `USAGE_GUIDE.md` pour ajouter features/systèmes
- Anti-patterns documentés : ne JAMAIS modifier l'état côté client
- Conventions de nommage : PascalCase pour classes/composants, camelCase pour variables
- Tests : Unit (Jest) + E2E (Playwright)

## [SECTION_2_NAME]
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
