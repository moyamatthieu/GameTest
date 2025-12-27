# API Contracts: Movement & Physics

## MovementController
Gère la capture des entrées clavier.

```typescript
interface IMovementController {
  getInputState(): InputState;
  dispose(): void; // Nettoyage des event listeners
}
```

## PhysicsEngine
Logique pure de calcul physique (sans dépendance Three.js si possible, ou minimale).

```typescript
interface IPhysicsEngine {
  /**
   * Calcule la nouvelle vélocité et position
   * @param currentPhysics État physique actuel
   * @param inputs Entrées utilisateur
   * @param deltaTime Temps écoulé en secondes
   * @param orientation Orientation actuelle (Quaternion)
   */
  update(
    currentPhysics: PhysicsComponent,
    inputs: InputState,
    deltaTime: number,
    orientation: THREE.Quaternion
  ): {
    velocity: THREE.Vector3;
    angularVelocity: THREE.Vector3;
  };
}
```

## MovementSystem
Système ECS orchestrant le mouvement.

```typescript
interface IMovementSystem {
  /**
   * Mise à jour appelée à chaque frame
   * @param deltaTime Temps écoulé
   */
  update(deltaTime: number): void;
}
```
