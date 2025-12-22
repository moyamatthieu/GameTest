# Instructions Copilot pour le projet DAoC Clone

Ce projet est un MMO prototype utilisant une architecture **Entity Component System (ECS)** partagée entre le client et le serveur.

## Architecture & Structure
- **`shared/`** : Contient le cœur de la logique de jeu (ECS, composants, systèmes de mouvement/combat). Tout ce qui doit être prédit par le client ou validé par le serveur doit être ici.
- **`server/`** : Autorité finale. Gère l'IA (`AISystem`), les quêtes (`QuestSystem`), et la persistance.
- **`client/`** : Rendu 3D (Three.js), UI, et gestion des entrées. Utilise la prédiction client pour le mouvement.

## Modèle ECS (Entity Component System)
Suivez strictement ces patterns pour toute nouvelle fonctionnalité :

### 1. Composants (`shared/src/components/`)
Chaque composant doit avoir un `static readonly TYPE` et une propriété `_type`.
```typescript
export class MyComponent implements Component {
  public static readonly TYPE = 'MyComponent';
  public readonly _type = MyComponent.TYPE;
  constructor(public value: number = 0) {}
}
```

### 2. Systèmes (`shared/src/systems/` ou `server/src/game/`)
Les systèmes étendent `System` et implémentent `update(dt: number, world: World)`.
- Utilisez `world.getEntitiesWith(Comp1, Comp2)` pour filtrer les entités.
- Exemple : `MovementSystem.ts` dans `shared` gère la logique de déplacement pour le client ET le serveur.

### 3. Rendu Client (`client/src/engine/RenderSystem.ts`)
Le `RenderSystem` synchronise les entités ECS avec les objets Three.js. Ne mettez pas de logique de jeu ici, seulement du rendu.

## Communication Réseau
- Le serveur envoie des snapshots via l'événement `SERVER_STATE`.
- Le client envoie ses entrées via `PLAYER_INPUT`.
- Utilisez `shared/src/types/` pour définir les interfaces de données réseau.

## Workflows de Développement
- **Lancer le projet** : `npm run dev` à la racine (lance client + serveur).
- **Build** : `npm run build` à la racine.
- **Ajouter un composant** : 
  1. Créer le fichier dans `shared/src/components/`.
  2. L'exporter dans `shared/src/components/index.ts`.
  3. L'exporter dans `shared/src/index.ts`.
- **Ajouter un système** :
  1. Créer le fichier dans `shared/src/systems/` (si partagé) ou `server/src/game/` (si serveur uniquement).
  2. L'ajouter au `World` dans `client/src/index.ts` et/ou `server/src/index.ts`.

## Conventions de Code
- **Types** : Utilisez toujours TypeScript de manière stricte.
- **Partage** : Si une logique impacte la position ou les stats, elle DOIT être dans `shared`.
- **Performance** : Évitez de créer des objets (vecteurs, etc.) dans les boucles `update` des systèmes pour limiter le Garbage Collection.
- **Ports** : Le serveur utilise le port `3000` et le client le port `5173`. Les scripts `predev` utilisent `fuser` pour libérer ces ports.
