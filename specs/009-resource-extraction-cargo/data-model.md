# Modèle de Données : Extraction de Ressources et Cargo

## Composants ECS

### `ResourceComponent`
Attaché aux planètes.
```typescript
interface ResourceComponent {
  resources: {
    type: ResourceType; // Fer, Cuivre, Eau, etc.
    abundance: number;  // Facteur de vitesse d'extraction ou quantité totale
  }[];
}
```

### `CargoComponent`
Attaché aux vaisseaux.
```typescript
interface CargoComponent {
  maxCapacity: number;
  inventory: {
    [key in ResourceType]?: number;
  };
  currentTotal: number;
}
```

### `MiningStateComponent`
Attaché aux vaisseaux en train de miner.
```typescript
interface MiningStateComponent {
  targetPlanetId: string;
  isMining: boolean;
  lastExtractionTime: number;
}
```

## Types de Ressources
Définis dans `common/types/resources.ts` (ou similaire).
```typescript
export enum ResourceType {
  FER = 'Fer',
  CUIVRE = 'Cuivre',
  EAU = 'Eau',
  HELIUM_3 = 'Hélium-3',
  SILICIUM = 'Silicium',
  URANIUM = 'Uranium',
  TITANE = 'Titane',
  TERRES_RARES = 'Terres Rares',
  HYDROGENE = 'Hydrogène',
  CARBONE = 'Carbone'
}
```

## Événements Réseau (P2P)
```typescript
interface MiningStartedMessage {
  type: 'MINING_STARTED';
  playerId: string;
  planetId: string;
}

interface MiningStoppedMessage {
  type: 'MINING_STOPPED';
  playerId: string;
}
```
