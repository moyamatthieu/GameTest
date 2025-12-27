# Implementation Plan: 008-ui-hud

**Branch**: `008-ui-hud` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)

## Summary

Implémentation d'une interface utilisateur (HUD) superposée au rendu 3D. L'UI sera construite en Vanilla HTML/CSS pour respecter la constitution. Elle comprendra une barre de vie, un réticule central, un radar 2D tactique et un panneau d'information sur la cible. La mise à jour des données se fera via une boucle de rendu UI synchronisée avec l'état du monde ECS.

## Technical Context

**Language/Version**: TypeScript (Strict)
**Primary Dependencies**: Aucune (Vanilla HTML/CSS)
**Testing**: Vitest (Unit), Playwright (E2E)
**Target Platform**: Web (Vite)
**Performance Goals**: 60 FPS UI updates, < 16ms latency
**Constraints**: Vanilla-first approach (Principle VI)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| VI. Vanilla-first | ✅ PASS | Utilisation exclusive de HTML/CSS/JS natif. |
| VII. Test-First | ✅ PASS | Tests unitaires pour la logique du radar et E2E pour l'affichage. |
| X. Rendu 3D Primitives | N/A | L'UI est en 2D HTML. |

## Project Structure

### Source Code

```text
src/
├── ui/
│   ├── components/
│   │   ├── HUD.ts              # Composant principal du HUD
│   │   ├── HealthBar.ts        # Sous-composant Barre de Vie
│   │   ├── Radar.ts            # Sous-composant Radar 2D
│   │   ├── Crosshair.ts        # Sous-composant Réticule
│   │   └── TargetInfo.ts       # Sous-composant Infos Cible
│   └── styles/
│       └── hud.css             # Styles CSS pour le HUD
└── main.ts                     # Initialisation du HUD
```

## Implementation Strategy

1. **CSS Scaffolding**: Définir les styles de base pour le HUD (positionnement absolute, z-index élevé).
2. **HUD Manager**: Créer une classe `HUDManager` qui orchestre les sous-composants.
3. **ECS Integration**: Mettre en place un système ou un listener qui extrait les données du `World` ECS (Health, Location) et du `SelectionManager` (entités sélectionnées) et les transmet au `HUDManager`.
4. **Radar Projection**: Implémenter la logique mathématique pour convertir les positions 3D relatives en coordonnées 2D sur le radar circulaire.
5. **Targeting Event**: S'abonner aux événements de combat pour mettre à jour le panneau `TargetInfo`.
