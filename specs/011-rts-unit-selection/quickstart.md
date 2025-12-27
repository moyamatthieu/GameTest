# Quickstart: RTS Unit Selection System

**Feature**: 011-rts-unit-selection  
**For**: Developers implementing or extending selection functionality

## Overview

This guide helps you get started with the RTS unit selection system. It covers:
- How to make entities selectable
- How to query selected units
- How to extend the system
- Common patterns and pitfalls

---

## Making an Entity Selectable

### Step 1: Add SelectableComponent

When creating a unit entity, add `SelectableComponent`:

```typescript
import { SelectableComponent } from './ecs/components/SelectableComponent';
import { IdentityManager } from './core/identity/IdentityManager';

// Create entity
const unitEntity = world.createEntity();

// Get local player ID
const localPlayerId = IdentityManager.getOrCreateIdentity().peerId;

// Add selectable component
const selectable = new SelectableComponent(localPlayerId, false, -1);
world.addComponent(unitEntity, selectable);
```

### Step 2: Link Mesh to Entity

Selection uses raycasting, which requires the Three.js mesh to know its entity ID:

```typescript
import { PrimitiveFactory } from './core/renderer/PrimitiveFactory';

// Create visual representation
const factory = new PrimitiveFactory();
const unitMesh = factory.createShip(); // or any mesh

// CRITICAL: Link mesh to entity
unitMesh.userData.entityId = unitEntity;

// Add to scene
sceneManager.addObject(unitMesh);
```

### Step 3: Add LocationComponent (for multi-scale)

Selection filters by `ViewScale`, so units need `LocationComponent`:

```typescript
import { LocationComponent } from './ecs/components/LocationComponent';

const location = new LocationComponent(
  0, 0,                    // clusterX, clusterY
  'system-1',              // systemId
  'Galaxy',                // viewScale
  { x: 0, y: 0, z: 0 }     // localPos
);
world.addComponent(unitEntity, location);
```

### Complete Example

```typescript
function createPlayerUnit(world: World, sceneManager: SceneManager): Entity {
  const localPlayerId = IdentityManager.getOrCreateIdentity().peerId;
  
  // 1. Create entity
  const entity = world.createEntity();
  
  // 2. Create visual mesh
  const factory = new PrimitiveFactory();
  const mesh = factory.createShip();
  mesh.userData.entityId = entity;  // LINK!
  mesh.userData.viewScale = 'Galaxy';
  sceneManager.addObject(mesh);
  
  // 3. Add components
  world.addComponent(entity, new SelectableComponent(localPlayerId, false, -1));
  world.addComponent(entity, new LocationComponent(0, 0, 'system-1', 'Galaxy', {x: 0, y: 0, z: 0}));
  // ... other components (Physics, Navigation, etc.)
  
  return entity;
}
```

---

## Querying Selected Units

### Get Selection State

```typescript
import { SelectionStateComponent } from './ecs/components/SelectionStateComponent';

function getSelectionState(world: World): SelectionStateComponent {
  const entities = world.getEntitiesWith(SelectionStateComponent);
  return world.getComponent(entities[0], SelectionStateComponent)!;
}
```

### Check if Units Selected

```typescript
const selectionState = getSelectionState(world);

if (selectionState.hasSelection()) {
  console.log(`${selectionState.getSelectedCount()} units selected`);
}
```

### Iterate Over Selected Units

```typescript
const selectionState = getSelectionState(world);

selectionState.selectedEntities.forEach(entityId => {
  const nav = world.getComponent(entityId, NavigationComponent);
  const health = world.getComponent(entityId, HealthComponent);
  
  if (nav && health) {
    console.log(`Unit ${entityId}: HP=${health.current}, Moving=${nav.hasTarget()}`);
  }
});
```

### Example: Give Move Order to Selected Units

```typescript
controller.onRightClick((mousePos) => {
  // Raycast to find target position
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mousePos, sceneManager.camera);
  
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const targetPos = new THREE.Vector3();
  
  if (raycaster.ray.intersectPlane(plane, targetPos)) {
    // Give order to all selected units
    const selectionState = getSelectionState(world);
    
    selectionState.selectedEntities.forEach(entityId => {
      const nav = world.getComponent(entityId, NavigationComponent);
      if (nav) {
        nav.setTarget(targetPos);
      }
    });
  }
});
```

---

## System Integration

### Initialize Systems in main.ts

```typescript
import { SelectionSystem } from './ecs/systems/SelectionSystem';
import { SelectionRenderSystem } from './ecs/systems/SelectionRenderSystem';
import { SelectionInputHandler } from './ui/input/SelectionInputHandler';
import { SelectionStateComponent } from './ecs/components/SelectionStateComponent';

// 1. Create selection state (singleton)
const globalEntity = world.createEntity();
world.addComponent(globalEntity, new SelectionStateComponent());

// 2. Create systems
const selectionSystem = new SelectionSystem(
  sceneManager.scene,
  sceneManager.camera,
  world,
  sceneManager
);

const selectionRenderSystem = new SelectionRenderSystem(
  sceneManager.scene,
  world
);

// 3. Create input handler
const selectionInputHandler = new SelectionInputHandler(
  gameCanvas.getCanvas(),
  selectionSystem
);

// 4. Add to game loop
function gameLoop(deltaTime: number) {
  // ... other systems
  
  selectionSystem.update(deltaTime);
  selectionRenderSystem.update(deltaTime);
  
  // ... render
}
```

### Hook Scale Transitions

If your game has multi-scale transitions (Galaxy/System/Planet):

```typescript
// In SceneManager or scale transition code
sceneManager.onScaleChange((newScale) => {
  // SelectionSystem automatically clears selection
  console.log(`Scale changed to ${newScale}, selection cleared`);
});
```

---

## Common Patterns

### Pattern 1: Filter Selected Units by Type

```typescript
const selectionState = getSelectionState(world);

// Get only selected combat units
const combatUnits = Array.from(selectionState.selectedEntities)
  .filter(entityId => {
    const weapon = world.getComponent(entityId, WeaponComponent);
    return weapon !== undefined;
  });

console.log(`${combatUnits.length} combat units selected`);
```

### Pattern 2: Select All Units of Type

```typescript
function selectAllShips(world: World, selectionSystem: SelectionSystem) {
  const selectionState = getSelectionState(world);
  selectionState.clearSelection();
  
  const ships = world.getEntitiesWith(SelectableComponent, WeaponComponent);
  
  ships.forEach(entity => {
    const selectable = world.getComponent(entity, SelectableComponent);
    if (selectable && selectable.ownerId === localPlayerId) {
      selectable.isSelected = true;
      selectionState.addEntity(entity);
    }
  });
}

// Bind to hotkey
controller.onKeyPress('KeyA', () => selectAllShips(world, selectionSystem));
```

### Pattern 3: Selection-Based UI Updates

```typescript
// Update HUD when selection changes
function onSelectionChange(world: World, hud: HUD) {
  const selectionState = getSelectionState(world);
  
  if (selectionState.hasSelection()) {
    const firstEntity = selectionState.getSelectedEntities()[0];
    const health = world.getComponent(firstEntity, HealthComponent);
    const cargo = world.getComponent(firstEntity, CargoComponent);
    
    hud.showUnitInfo({
      count: selectionState.getSelectedCount(),
      health: health?.current,
      cargo: cargo?.current
    });
  } else {
    hud.hideUnitInfo();
  }
}

// Call in game loop or on selection change event
```

---

## Extending the System

### Add Control Groups (1-9 Keys)

```typescript
class ControlGroupManager {
  private groups: Map<number, Set<Entity>> = new Map();
  
  constructor(private world: World, private selectionSystem: SelectionSystem) {
    this.setupHotkeys();
  }
  
  private setupHotkeys(): void {
    // Ctrl+1-9: Save current selection to group
    for (let i = 1; i <= 9; i++) {
      controller.onKeyPress(`Digit${i}`, (event) => {
        if (event.ctrlKey) {
          this.saveGroup(i);
        } else {
          this.loadGroup(i);
        }
      });
    }
  }
  
  private saveGroup(groupNumber: number): void {
    const selectionState = getSelectionState(this.world);
    this.groups.set(groupNumber, new Set(selectionState.selectedEntities));
    console.log(`Saved ${selectionState.getSelectedCount()} units to group ${groupNumber}`);
  }
  
  private loadGroup(groupNumber: number): void {
    const group = this.groups.get(groupNumber);
    if (!group) return;
    
    // Clear current selection
    this.selectionSystem.clearSelection();
    
    // Select group
    const selectionState = getSelectionState(this.world);
    group.forEach(entityId => {
      if (this.world.entities.has(entityId)) { // Check entity still exists
        const selectable = this.world.getComponent(entityId, SelectableComponent);
        if (selectable) {
          selectable.isSelected = true;
          selectionState.addEntity(entityId);
        }
      }
    });
  }
}

// In main.ts
const controlGroups = new ControlGroupManager(world, selectionSystem);
```

### Customize Selection Circle Appearance

```typescript
// In SelectionRenderSystem constructor
this.circleMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,        // Change color (e.g., 0xff0000 for red)
  side: THREE.DoubleSide,
  depthTest: false,
  transparent: true,
  opacity: 0.8            // Change opacity (0.0 - 1.0)
});

// Different sizes per unit type
const size = hasWeapon ? 2.5 : 2.0; // Bigger circles for combat units
this.circleGeometry = new THREE.RingGeometry(size, size + 0.2, 32);
```

### Add Hover Preview

```typescript
class SelectionSystem {
  private hoveredEntity: Entity | null = null;
  
  public updateHover(mousePos: { x: number, y: number }): void {
    const entity = this.raycastSelect(mousePos);
    
    if (entity !== this.hoveredEntity) {
      // Clear previous hover
      if (this.hoveredEntity) {
        // Remove hover visual (e.g., outline)
      }
      
      // Add hover visual to new entity
      if (entity) {
        // Add hover visual
      }
      
      this.hoveredEntity = entity;
    }
  }
}

// In game loop
selectionSystem.updateHover(controller.getMouseState().pos);
```

---

## Troubleshooting

### Units Not Selectable

**Symptom**: Clicking on unit does nothing

**Checklist**:
1. ✅ Does entity have `SelectableComponent`?
2. ✅ Does mesh have `userData.entityId` set?
3. ✅ Is `ownerId` set to local player ID?
4. ✅ Does entity have `LocationComponent` with correct `viewScale`?
5. ✅ Is mesh added to scene with `sceneManager.addObject()`?

**Debug**:
```typescript
// In SelectionSystem.selectAt()
console.log('Raycast intersects:', intersects.length);
console.log('Entity ID:', intersects[0]?.object.userData.entityId);
console.log('Has SelectableComponent:', world.getComponent(entityId, SelectableComponent) !== undefined);
```

### Selection Circles Not Visible

**Symptom**: Units are selected (logic works) but no circles appear

**Checklist**:
1. ✅ Is `SelectionRenderSystem` added to game loop?
2. ✅ Is `SelectionRenderSystem.update()` called every frame?
3. ✅ Are circle materials using `depthTest: false`?
4. ✅ Is `instancedCircles` added to scene?

**Debug**:
```typescript
// In SelectionRenderSystem.update()
console.log('Selected entities:', selectedEntities.length);
console.log('Instance count:', this.instancedCircles.count);
console.log('Circles in scene:', this.scene.children.includes(this.instancedCircles));
```

### Box Selection Not Working

**Symptom**: Drag doesn't create selection box or select units

**Checklist**:
1. ✅ Is `SelectionInputHandler` instantiated?
2. ✅ Is drag threshold met (>5px movement)?
3. ✅ Is `SelectionBox` element in DOM?

**Debug**:
```typescript
// In SelectionInputHandler.onMouseMove()
console.log('Drag distance:', Math.sqrt(dx*dx + dy*dy));
console.log('Is dragging:', this.isDragging);

// In SelectionInputHandler.onMouseUp()
console.log('Box selection from', startNDC, 'to', endNDC);
```

### Selection Persists Across Scales

**Symptom**: Selection doesn't clear when changing scales

**Fix**:
```typescript
// Ensure SelectionSystem.onScaleChange is hooked up
sceneManager.onScaleChange((newScale) => {
  selectionSystem.clearSelection();
});
```

---

## Performance Tips

### Optimize Raycasting

```typescript
// Use raycaster layers to filter by scale
raycaster.layers.set(scaleToLayer(currentScale));

// Set on meshes
unitMesh.layers.set(scaleToLayer('Galaxy'));
```

### Limit Selection Count

```typescript
// In SelectionSystem.selectBox()
const MAX_SELECTION = 500;

if (candidates.length > MAX_SELECTION) {
  console.warn(`Box selection exceeds ${MAX_SELECTION}, limiting selection`);
  candidates = candidates.slice(0, MAX_SELECTION);
}
```

### Throttle Circle Updates

```typescript
// In SelectionRenderSystem
private lastUpdateTime = 0;
private updateInterval = 16; // Update every 16ms (60 FPS)

public update(deltaTime: number): void {
  this.lastUpdateTime += deltaTime;
  
  if (this.lastUpdateTime < this.updateInterval) {
    return; // Skip this frame
  }
  
  this.lastUpdateTime = 0;
  // ... perform update
}
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { World } from './ecs/World';
import { SelectableComponent } from './ecs/components/SelectableComponent';
import { SelectionStateComponent } from './ecs/components/SelectionStateComponent';

describe('Selection Logic', () => {
  it('should select and deselect units', () => {
    const world = new World();
    
    // Create selection state
    const globalEntity = world.createEntity();
    const selectionState = new SelectionStateComponent();
    world.addComponent(globalEntity, selectionState);
    
    // Create unit
    const unit = world.createEntity();
    const selectable = new SelectableComponent('player-1', false, -1);
    world.addComponent(unit, selectable);
    
    // Select unit
    selectable.isSelected = true;
    selectionState.addEntity(unit);
    
    expect(selectionState.hasSelection()).toBe(true);
    expect(selectionState.getSelectedCount()).toBe(1);
    expect(selectable.isSelected).toBe(true);
    
    // Deselect unit
    selectable.isSelected = false;
    selectionState.removeEntity(unit);
    
    expect(selectionState.hasSelection()).toBe(false);
  });
});
```

---

## Further Reading

- [data-model.md](./data-model.md): Complete component schemas
- [contracts/](./contracts/): System interfaces and contracts
- [plan.md](./plan.md): Full implementation plan and architecture

---

**Quickstart Status**: Complete ✅  
**Last Updated**: 2025-12-26
