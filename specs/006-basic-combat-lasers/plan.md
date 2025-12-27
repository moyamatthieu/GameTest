# Implementation Plan: Feature 006: Basic Combat (Lasers)

**Branch**: `006-basic-combat-lasers` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)
**Input**: Spécification de la fonctionnalité depuis `specs/006-basic-combat-lasers/spec.md`

## Summary

Cette fonctionnalité permet aux joueurs de tirer des lasers depuis leurs vaisseaux. Les lasers sont des projectiles avec une vitesse constante, une durée de vie limitée et une détection de collision. Le système inclut une gestion des points de vie (HP) et une synchronisation P2P des tirs et des impacts via PeerJS.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Three.js, PeerJS  
**Storage**: N/A (État transitoire en mémoire)  
**Testing**: Vitest  
**Target Platform**: Web (Navigateur)
**Project Type**: Web application (Single project)
**Performance Goals**: 60 FPS, Latence de synchronisation < 250ms  
**Constraints**: Architecture P2P décentralisée, pas de serveur central pour la logique de combat.  
**Scale/Scope**: Implémentation initiale du combat spatial.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Architecture P2P (Principe I)** : ✅ Le combat utilise PeerJS pour la synchronisation directe entre pairs, respectant l'architecture décentralisée.
2. **Validation Distribuée (Principe I)** : ⚠️ La détection de collision initiale sera faite côté tireur (Shooter-side), mais devra évoluer vers une validation par consensus pour éviter la triche.
3. **Structure Spatiale (Principe II)** : ✅ Le combat s'intègre dans la vue "Système" ou "Planétaire" du Lattice.
4. **TypeScript First (Principe III)** : ✅ Tout le nouveau code sera en TypeScript avec un typage strict.
5. **Minimiser les Dépendances (Principe VI)** : ✅ Utilisation de Three.js natif pour le rendu des lasers sans bibliothèques tierces.

## Project Structure

### Documentation (this feature)

```text
specs/006-basic-combat-lasers/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── combat-messages.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── combat/
│   │   ├── CombatManager.ts
│   │   ├── ProjectileManager.ts
│   │   └── types.ts
│   ├── physics/
│   │   └── CollisionSystem.ts
├── ecs/
│   ├── components/
│   │   ├── HealthComponent.ts
│   │   └── WeaponComponent.ts
│   └── systems/
│       ├── CombatSystem.ts
│       └── ProjectileSystem.ts
├── ui/
│   └── components/
│       └── HealthBar.ts

tests/
├── unit/
│   ├── core/
│   │   └── combat/
│   └── ecs/
│       └── systems/
```

**Structure Decision**: Utilisation d'une approche hybride ECS pour la logique de jeu (HealthComponent, CombatSystem) et de gestionnaires dédiés pour le rendu et la physique des projectiles.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
