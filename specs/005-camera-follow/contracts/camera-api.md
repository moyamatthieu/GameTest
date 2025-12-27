# API Contract: Camera Controller

Le `CameraController` est le point d'entrée principal pour la gestion de la vue.

## Interface `ICameraController`

```typescript
interface ICameraController {
  /**
   * Définit la cible à suivre.
   */
  setTarget(target: THREE.Object3D): void;

  /**
   * Change le mode de caméra.
   */
  setMode(mode: CameraMode): void;

  /**
   * Bascule au mode suivant (Chase -> Cockpit -> Orbit -> Chase).
   */
  cycleMode(): void;

  /**
   * Mise à jour de la position/rotation de la caméra.
   * Doit être appelée à chaque frame.
   */
  update(deltaTime: number): void;

  /**
   * Gère les entrées souris pour le mode Orbite.
   */
  handleMouseMove(deltaX: number, deltaY: number): void;
}
```

## Intégration Renderer

Le `Renderer` doit exposer une instance de `CameraController`.

```typescript
class Renderer {
  public cameraController: CameraController;
  // ...
}
```
