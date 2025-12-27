# Tests - Suite de Tests Complète

Tests unitaires, d'intégration et end-to-end pour assurer la qualité du code.

## 📁 Structure

```
tests/
├── unit/                 # Tests unitaires (Jest)
│   ├── ecs/
│   │   └── World.test.ts
│   ├── systems/
│   │   └── EconomySystem.test.ts
│   └── network/
│       └── Protocol.test.ts
├── integration/          # Tests d'intégration
│   └── game-loop.test.ts
└── e2e/                  # Tests end-to-end (Playwright)
    └── building-placement.spec.ts
```

## 🧪 Exécution

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests E2E uniquement
npm run test:e2e

# En mode watch
npm run test:unit -- --watch
```

## ✅ Couverture

Objectifs de couverture :
- **Logique serveur** (common/ecs/systems/) : ≥80%
- **Core client** (src/core/) : ≥70%
- **UI** (src/ui/) : Tests E2E obligatoires

## 📝 Ajouter un Test

### Test Unitaire (Jest)

```typescript
// tests/unit/systems/NewSystem.test.ts
import { World } from '../../../common/ecs/World'
import { NewSystem } from '../../../common/ecs/systems/NewSystem'

describe('NewSystem', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  test('should do something', () => {
    // Arrange
    const entity = world.createEntity()
    world.addComponent(entity, 'Component', { value: 10 })

    // Act
    NewSystem(world, 1.0)

    // Assert
    const comp = world.getComponent(entity, 'Component')
    expect(comp.value).toBe(15)
  })
})
```

### Test E2E (Playwright)

```typescript
// tests/e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test'

test('user can perform action', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Attendre la connexion
  await page.waitForSelector('.game-loaded')
  
  // Cliquer sur un bouton
  await page.click('#action-button')
  
  // Vérifier le résultat
  await expect(page.locator('.feedback')).toHaveText('Success')
})
```

## 📚 Voir Aussi

- [TEST_PLAN.md](../TEST_PLAN.md) - Plan de tests complet
- [jest.config.mjs](../jest.config.mjs) - Configuration Jest
- [playwright.config.js](../playwright.config.js) - Configuration Playwright
