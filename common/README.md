# Common - Code Partagé Client/Serveur

Ce dossier contient tout le code partagé entre le client et le serveur, principalement l'architecture **ECS** (Entity Component System).

## 📁 Structure

```
common/
├── ecs/
│   ├── World.ts              # Moteur ECS principal (gestion entités/composants)
│   ├── components.ts         # Définitions de TOUS les composants (données pures)
│   └── systems/              # TOUTE la logique métier
│       ├── EconomySystem.ts
│       ├── FleetSystem.ts
│       ├── CombatSystem.ts
│       ├── LogisticsSystem.ts
│       ├── SovereigntySystem.ts
│       └── RoadSystem.ts
└── types/
    ├── index.ts              # Point d'entrée des types
    ├── components.ts         # Interfaces des composants
    ├── ecs.ts                # Types ECS (Entity, ComponentMask, etc.)
    ├── game.ts               # Types spécifiques au jeu
    └── network.ts            # Types réseau
```

## 🎯 Principes

### 1. Architecture ECS Pure

**Components (components.ts)**
- Structures de données **PURES** (pas de méthodes, pas de logique)
- Exemple : `Position`, `Velocity`, `Economy`, `Combat`
- Immutables côté client, mutables côté serveur

**Systems (systems/)**
- Contiennent **TOUTE** la logique métier
- Exécutés **UNIQUEMENT** côté serveur
- Lisent et modifient les composants

**World (World.ts)**
- Gère les entités (IDs numériques)
- Attache/détache les composants
- Requêtes efficaces : `getEntitiesWith('Position', 'Velocity')`

### 2. Autorité Serveur

⚠️ **CRITIQUE** : Les systems sont **partagés** mais **exécutés uniquement côté serveur**

```typescript
// ❌ JAMAIS faire ça côté client
import { EconomySystem } from 'common/ecs/systems/EconomySystem'
world.addSystem(EconomySystem) // Le client n'exécute PAS les systems !

// ✅ Côté serveur uniquement
// server/ecs/ServerWorld.ts
world.addSystem(EconomySystem)
```

### 3. TypeScript Strict

Tous les fichiers sont en TypeScript avec :
- Types explicites
- `strict: true`
- Pas de `any` (sauf justification documentée)
- Interfaces dans `common/types/`

## 📝 Ajouter un Nouveau Composant

1. **Définir le type** dans `common/types/components.ts` :
```typescript
export interface DiplomacyData {
  faction: string;
  relations: Map<number, number>; // factionId -> reputation
  treaties: string[];
}
```

2. **Créer la factory** dans `common/ecs/components.ts` :
```typescript
export const Diplomacy = (faction = 'neutral'): DiplomacyData => ({
  faction,
  relations: new Map(),
  treaties: []
})
```

3. **Ajouter le bitmask** dans `common/types/ecs.ts` :
```typescript
export const ComponentTypes = {
  // ... existants
  Diplomacy: 1 << 22,
}
```

## 📝 Ajouter un Nouveau Système

1. **Créer le fichier** dans `common/ecs/systems/` :
```typescript
// common/ecs/systems/DiplomacySystem.ts
import type { World } from '../World'

export const DiplomacySystem = (world: World, deltaTime: number): void => {
  const entities = world.getEntitiesWith('Diplomacy', 'Sovereignty')
  
  for (const entity of entities) {
    const diplomacy = world.getComponent(entity, 'Diplomacy')
    // ... logique ici
  }
}
```

2. **Enregistrer côté serveur** dans `server/ecs/ServerWorld.ts` :
```typescript
import { DiplomacySystem } from '../../common/ecs/systems/DiplomacySystem'

export class ServerWorld extends World {
  constructor() {
    super()
    this.addSystem(DiplomacySystem)
  }
}
```

## 🚫 Ce qui n'est PAS ici

- **Rendu** → `src/render/`
- **Input/UI** → `src/ui/`, `src/input/`
- **Réseau client** → `src/core/NetworkManager.ts`
- **Base de données** → `server/db/`

## 📚 Voir Aussi

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Vue d'ensemble de l'architecture
- [USAGE_GUIDE.md](../USAGE_GUIDE.md) - Patterns de développement
- [server/README.md](../server/README.md) - Exécution serveur des systems
- [src/README.md](../src/README.md) - Rendu client
