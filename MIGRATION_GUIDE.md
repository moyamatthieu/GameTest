# Guide de Migration JavaScript vers TypeScript

Ce guide fournit des instructions et des meilleures pratiques pour convertir les fichiers JavaScript existants du projet `jeux_gestion` vers TypeScript.

## 📋 Sommaire
- [Guide de Migration JavaScript vers TypeScript](#guide-de-migration-javascript-vers-typescript)
  - [📋 Sommaire](#-sommaire)
  - [1. Étapes de conversion pas à pas](#1-étapes-de-conversion-pas-à-pas)
  - [2. Typage Progressif (any \& unknown)](#2-typage-progressif-any--unknown)
  - [3. Exemples de Conversion](#3-exemples-de-conversion)
    - [Composant ECS](#composant-ecs)
    - [Système ECS](#système-ecs)
    - [Classe Utilitaire](#classe-utilitaire)
  - [4. Utilisation des Utility Types](#4-utilisation-des-utility-types)

---

## 1. Étapes de conversion pas à pas

Pour convertir un fichier `.js` en `.ts` :

1. **Renommer le fichier** : Changez l'extension de `.js` en `.ts`.
2. **Ajouter les imports de types** : Importez les interfaces nécessaires depuis `common/types`.
3. **Définir les interfaces locales** : Si le fichier contient des structures de données complexes, créez des interfaces pour les décrire.
4. **Typer les fonctions** :
    - Ajoutez des types aux paramètres.
    - Spécifiez le type de retour (ex: `: void`, `: number`, `: Promise<void>`).
5. **Typer les variables et membres de classe** : Déclarez les types des propriétés de classe.
6. **Résoudre les erreurs de compilation** : Utilisez le typage progressif si nécessaire pour ne pas bloquer le flux de travail.

---

## 2. Typage Progressif (any & unknown)

La migration peut être longue. Pour éviter de bloquer la compilation :

- **`any`** : À utiliser en dernier recours. Il désactive toute vérification de type. Utile pour les objets tiers complexes ou les parties du code non encore migrées.
  ```typescript
  // Temporaire : on ne sait pas encore typer cet objet complexe
  const legacyData: any = getLegacyData();
  ```
- **`unknown`** : Préférable à `any`. Il force à vérifier le type avant utilisation (Type Guard).
  ```typescript
  const processData = (data: unknown) => {
    if (typeof data === 'string') {
      console.log(data.toUpperCase()); // OK
    }
  };
  ```
- **`// @ts-expect-error`** : Utilisez ceci pour ignorer une erreur connue tout en documentant qu'elle existe. C'est mieux que `// @ts-ignore` car TS vous préviendra si l'erreur disparaît.

---

## 3. Exemples de Conversion

### Composant ECS
*Fichier source : `common/ecs/components.js`*

```typescript
// common/ecs/components.ts

export interface EconomyData {
  metal: number;
  energy: number;
  credits: number;
  production: {
    metal: number;
    energy: number;
    credits: number;
  };
}

export const Economy = (metal = 0, energy = 0, credits = 0): EconomyData => ({
  metal,
  energy,
  credits,
  production: {
    metal: 0,
    energy: 0,
    credits: 0,
  },
});
```

### Système ECS
*Fichier source : `common/ecs/systems/EconomySystem.js`*

```typescript
// common/ecs/systems/EconomySystem.ts
import { IWorld, Entity } from '../../types/ecs';
import { EconomyData } from '../components';

export const EconomySystem = (world: IWorld, deltaTime: number): void => {
  const economyEntities = world.getEntitiesWith(['Economy']);

  for (const entity of economyEntities) {
    const economy = world.getComponent<EconomyData>(entity, 'Economy');
    if (!economy) continue;

    economy.production.metal = 0;
    economy.production.energy = 0;
    economy.production.credits = 0;
  }
  // ... suite de la logique
};
```

### Classe Utilitaire
*Fichier source : `src/planet/BuildingGrid.js`*

```typescript
// src/planet/BuildingGrid.ts
import * as THREE from 'three';
import { PlanetGenerator } from './PlanetGenerator';

interface GridOptions {
  cellSize?: number;
  maxSlope?: number;
}

export class BuildingGrid {
  private planetGenerator: PlanetGenerator;
  private cellSize: number;
  private maxSlope: number;
  private occupiedCells: Map<string, number>; // "theta,phi" -> entityId
  private gridMesh: THREE.Points | null = null;
  private gridVisible: boolean = false;

  constructor(planetGenerator: PlanetGenerator, options: GridOptions = {}) {
    this.planetGenerator = planetGenerator;
    this.cellSize = options.cellSize || 5;
    this.maxSlope = options.maxSlope || 25;
    this.occupiedCells = new Map();
  }

  public worldToGrid(position: THREE.Vector3): { theta: number; phi: number } {
    const normalized = position.clone().normalize();
    const spherical = this.planetGenerator.cartesianToSpherical(
      normalized.x,
      normalized.y,
      normalized.z
    );

    return {
      theta: this.roundToGrid(spherical.theta),
      phi: this.roundToGrid(spherical.phi)
    };
  }

  private roundToGrid(angle: number): number {
    const arcLength = angle * this.planetGenerator.radius;
    const snapped = Math.round(arcLength / this.cellSize) * this.cellSize;
    return snapped / this.planetGenerator.radius;
  }
}
```

---

## 4. Utilisation des Utility Types

TypeScript fournit des outils puissants pour manipuler les types existants :

- **`Partial<T>`** : Rend toutes les propriétés de `T` optionnelles. Idéal pour les fonctions de mise à jour.
  ```typescript
  // Mise à jour partielle d'un composant Economy
  const updateEconomy = (entity: Entity, data: Partial<EconomyData>) => {
    const current = world.getComponent<EconomyData>(entity, 'Economy');
    Object.assign(current, data);
  };
  ```

- **`Pick<T, K>`** : Crée un type en choisissant seulement certaines propriétés `K` de `T`.
  ```typescript
  // On ne veut envoyer que les ressources au client, pas la production
  type ResourceUpdate = Pick<EconomyData, 'metal' | 'energy' | 'credits'>;
  ```

- **`Omit<T, K>`** : Crée un type en supprimant les propriétés `K` de `T`.
  ```typescript
  // Données de bâtiment sans l'ID d'entité
  type BuildingTemplate = Omit<BuildingData, 'entityId'>;
  ```

- **`Record<K, T>`** : Pour définir des objets de type "dictionnaire".
  ```typescript
  // Map des ressources par nom
  const inventory: Record<string, number> = {
    metal: 100,
    gas: 50
  };
  ```
