# Quickstart: Camera Follow

## Installation

Aucune dépendance supplémentaire n'est requise au-delà de Three.js.

## Utilisation de base

1. **Initialisation** :
   Le `CameraController` est créé automatiquement par le `Renderer`.

2. **Changement de mode** :
   Appuyez sur la touche **'C'** pour basculer entre les modes Poursuite, Cockpit et Orbite.

3. **Mode Orbite** :
   En mode Orbite, déplacez la souris pour faire pivoter la vue autour du vaisseau.

## Exemple de code (Interne)

```typescript
const cameraController = new CameraController(camera);
cameraController.setTarget(playerShip);

// Dans la boucle de rendu
function animate() {
  const dt = clock.getDelta();
  cameraController.update(dt);
  renderer.render(scene, camera);
}
```

## Tests

Pour lancer les tests unitaires de la caméra :
```bash
npm test tests/unit/core/renderer/CameraController.test.ts
```
