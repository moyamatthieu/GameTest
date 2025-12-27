# Data Model: Camera Follow

## Enums

### CameraMode
Définit les différents comportements de la caméra.
- `CHASE`: Suit le vaisseau par l'arrière avec interpolation.
- `COCKPIT`: Fixée à la position du cockpit, sans délai.
- `ORBIT`: Tourne autour du vaisseau selon les entrées utilisateur.

## Interfaces

### CameraConfig
Configuration des paramètres de suivi.
```typescript
interface CameraConfig {
  chase: {
    offset: THREE.Vector3; // Position relative (ex: [0, 5, -15])
    lookAtOffset: THREE.Vector3; // Point regardé par rapport au centre
    lerpFactor: number; // Vitesse de suivi (0.1 - 0.9)
  };
  orbit: {
    distance: number;
    sensitivity: number;
  };
}
```

### CameraState
État interne du contrôleur.
```typescript
interface CameraState {
  currentMode: CameraMode;
  target: THREE.Object3D | null;
  theta: number; // Angle horizontal (Orbit)
  phi: number;   // Angle vertical (Orbit)
}
```
