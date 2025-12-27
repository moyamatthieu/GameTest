# Quickstart: Moteur de Rendu 3D

## Installation

```bash
npm install three
npm install -D @types/three
```

## Usage

### Initialisation du Renderer

```typescript
import { Renderer } from './core/renderer/Renderer';

const container = document.getElementById('game-container');
const renderer = new Renderer(container);

renderer.init().then(() => {
  console.log('Renderer initialized');
  renderer.start();
});
```

### Ajout d'un vaisseau de test

```typescript
import { PrimitiveFactory } from './core/renderer/PrimitiveFactory';

const factory = new PrimitiveFactory();
const ship = factory.createShip();
renderer.sceneManager.addObject(ship);
```

## Running Tests

```bash
# Unit tests
npm test tests/unit/core/renderer

# E2E tests (Visual)
npx playwright test tests/e2e/renderer
```
