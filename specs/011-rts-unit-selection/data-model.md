# Data Model: RTS Unit Selection System

**Feature**: 011-rts-unit-selection  
**Date**: 2025-12-26

## Overview

This document defines all data structures (ECS components, system state, and UI models) for the RTS unit selection system.
b
---

## ECS Components

### SelectableComponent

**Purpose**: Marks an entity as selectable and tracks selection state

**Location**: `src/ecs/components/SelectableComponent.ts`

**Schema**:
```typescript
import { Component } from '../World';

export class SelectableComponent implements Component {
  constructor(
    public ownerId: string,                    // Player ID who owns this unit
    public isSelected: boolean = false,        // Current selection state
    public selectionCircleIndex: number = -1   // Index in InstancedMesh (-1 if not selected)
  ) {}
}
```

**Field Descriptions**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `ownerId` | `string` | Player ID who owns this unit | Must match local player ID to be selectable |
| `isSelected` | `boolean` | Whether this entity is currently selected | Updated by SelectionSystem |
| `selectionCircleIndex` | `number` | Position in InstancedMesh, or -1 if not rendered | Managed by SelectionRenderSystem |

**Lifecycle**:
- Created when unit entity is spawned
- Updated when selection state changes
- Removed when entity is destroyed

**Relationships**:
- Required for selection logic (queried by SelectionSystem)
- Used by SelectionRenderSystem to position circles
- Filtered by ownerId (only local player's units selectable)

**Changes from Existing**:
- ❌ **Remove**: `selectionCircle: THREE.Mesh` field
- ✅ **Keep**: `ownerId: string`, `isSelected: boolean`
- ✅ **Add**: `selectionCircleIndex: number`

**Migration**:
```typescript
// OLD (current implementation)
new SelectableComponent(playerId, false, individualMesh);

// NEW (refactored)
new SelectableComponent(playerId, false, -1);
```

---

### SelectionStateComponent

**Purpose**: Global singleton holding all selection state

**Location**: `src/ecs/components/SelectionStateComponent.ts` (NEW)

**Schema**:
```typescript
import { Component } from '../World';
import { Entity } from '../World';

export class SelectionStateComponent implements Component {
  constructor(
    public selectedEntities: Set<Entity> = new Set(),
    public selectionBox: {
      active: boolean;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    } | null = null
  ) {}
  
  // Helper methods
  
  public getSelectedCount(): number {
    return this.selectedEntities.size;
  }
  
  public hasSelection(): boolean {
    return this.selectedEntities.size > 0;
  }
  
  public clearSelection(): void {
    this.selectedEntities.clear();
  }
  
  public addEntity(entity: Entity): void {
    this.selectedEntities.add(entity);
  }
  
  public removeEntity(entity: Entity): void {
    this.selectedEntities.delete(entity);
  }
  
  public toggleEntity(entity: Entity): void {
    if (this.selectedEntities.has(entity)) {
      this.selectedEntities.delete(entity);
    } else {
      this.selectedEntities.add(entity);
    }
  }
  
  public isEntitySelected(entity: Entity): boolean {
    return this.selectedEntities.has(entity);
  }
  
  public getSelectedEntities(): Entity[] {
    return Array.from(this.selectedEntities);
  }
}
```

**Field Descriptions**:

| Field | Type | Description |
|-------|------|-------------|
| `selectedEntities` | `Set<Entity>` | Set of currently selected entity IDs |
| `selectionBox` | `object \| null` | Active box selection state, or null if not dragging |
| `selectionBox.active` | `boolean` | Whether box selection is in progress |
| `selectionBox.startX/Y` | `number` | Screen coordinates of drag start |
| `selectionBox.endX/Y` | `number` | Current screen coordinates of drag |

**Singleton Pattern**:
```typescript
// In main.ts or game initialization
const globalEntity = world.createEntity();
const selectionState = new SelectionStateComponent();
world.addComponent(globalEntity, selectionState);

// Access from any system
function getSelectionState(world: World): SelectionStateComponent {
  const entities = world.getEntitiesWith(SelectionStateComponent);
  if (entities.length === 0) {
    throw new Error('SelectionStateComponent not found - not initialized');
  }
  return world.getComponent(entities[0], SelectionStateComponent)!;
}
```

**Usage Examples**:

```typescript
// Query selected units
const selectionState = getSelectionState(world);
if (selectionState.hasSelection()) {
  selectionState.selectedEntities.forEach(entityId => {
    // Give order to entity
    const nav = world.getComponent(entityId, NavigationComponent);
    nav?.setTarget(targetPos);
  });
}

// Check if specific entity is selected
if (selectionState.isEntitySelected(myEntity)) {
  // Do something
}
```

---

### LocationComponent (existing, no changes)

**Purpose**: Stores entity's position and current ViewScale

**Location**: `src/ecs/components/LocationComponent.ts`

**Relevant Fields**:
```typescript
export class LocationComponent implements Component {
  constructor(
    public clusterX: number = 0,
    public clusterY: number = 0,
    public systemId: string = '',
    public viewScale: ViewScale = 'Galaxy',
    public localPos: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ) {}
  
  // ... (existing methods)
}
```

**Usage in Selection**:
- `viewScale` field is used to filter selectable entities by current scale
- Selection only operates on entities matching `sceneManager.getCurrentViewScale()`

---

## System State

### SelectionSystem State

**Internal State**:
```typescript
export class SelectionSystem {
  private raycaster: THREE.Raycaster;        // Reused raycaster instance
  private localPlayerId: string;              // Local player ID (for filtering)
  
  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private world: World,
    private sceneManager: SceneManager
  ) {
    this.raycaster = new THREE.Raycaster();
    this.localPlayerId = IdentityManager.getOrCreateIdentity().peerId;
  }
  
  // ... (methods)
}
```

**No Persistent State**: SelectionSystem is stateless - all state lives in components

---

### SelectionRenderSystem State

**Internal State**:
```typescript
export class SelectionRenderSystem {
  private instancedCircles: THREE.InstancedMesh;
  private circleGeometry: THREE.RingGeometry;
  private circleMaterial: THREE.MeshBasicMaterial;
  private readonly maxInstances = 1000;
  
  constructor(
    private scene: THREE.Scene,
    private world: World
  ) {
    this.initInstancedMesh();
  }
  
  private initInstancedMesh(): void {
    this.circleGeometry = new THREE.RingGeometry(2, 2.2, 32);
    this.circleGeometry.rotateX(-Math.PI / 2);
    
    this.circleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 0.8
    });
    
    this.instancedCircles = new THREE.InstancedMesh(
      this.circleGeometry,
      this.circleMaterial,
      this.maxInstances
    );
    
    this.instancedCircles.count = 0; // Initially no circles
    this.scene.add(this.instancedCircles);
  }
  
  // ... (methods)
}
```

**Rendering Resources**:
- `instancedCircles`: Main rendering object (added to scene)
- `circleGeometry`: Shared geometry for all circles
- `circleMaterial`: Shared material (green color)

---

## UI Models

### SelectionBox State

**Purpose**: Tracks box selection drag state for visual overlay

**Location**: `src/ui/overlay/SelectionBox.ts`

**Schema**:
```typescript
export class SelectionBox {
  private element: HTMLDivElement;
  private isVisible = false;
  
  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'selection-box';
    this.setupStyles();
    container.appendChild(this.element);
  }
  
  private setupStyles(): void {
    this.element.style.position = 'absolute';
    this.element.style.border = '2px solid #00ff00';
    this.element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    this.element.style.pointerEvents = 'none';
    this.element.style.display = 'none';
    this.element.style.zIndex = '1000';
  }
  
  public show(x1: number, y1: number, x2: number, y2: number): void {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.element.style.display = 'block';
    this.isVisible = true;
  }
  
  public hide(): void {
    this.element.style.display = 'none';
    this.isVisible = false;
  }
  
  public dispose(): void {
    this.element.remove();
  }
}
```

**HTML Structure**:
```html
<div id="app">
  <canvas></canvas>
  <div class="selection-box" style="display: none;"></div>
</div>
```

---

### SelectionInputHandler State

**Purpose**: Tracks mouse input state for click vs drag detection

**Location**: `src/ui/input/SelectionInputHandler.ts`

**Schema**:
```typescript
export class SelectionInputHandler {
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private readonly dragThreshold = 5; // pixels
  private selectionBox: SelectionBox;
  
  constructor(
    private canvas: HTMLCanvasElement,
    private selectionSystem: SelectionSystem
  ) {
    this.selectionBox = new SelectionBox(canvas.parentElement!);
    this.registerEventListeners();
  }
  
  // ... (methods)
}
```

**Internal State**:

| Field | Type | Description |
|-------|------|-------------|
| `isDragging` | `boolean` | Whether user is currently dragging (distance > threshold) |
| `dragStartX/Y` | `number` | Screen coordinates where mouse down occurred |
| `dragThreshold` | `number` | Minimum pixel distance to trigger drag (5px) |
| `selectionBox` | `SelectionBox` | Visual overlay for box selection |

---

## Data Flow

### Selection State Updates

```
User Input
    ↓
SelectionInputHandler (UI layer)
    ↓ (calls)
SelectionSystem.selectAt() or .selectBox()
    ↓ (updates)
SelectableComponent.isSelected (per entity)
    ↓ (updates)
SelectionStateComponent.selectedEntities (global)
    ↓ (read by, next frame)
SelectionRenderSystem
    ↓ (updates)
THREE.InstancedMesh positions
    ↓
Visual Feedback (green circles)
```

### Command Execution Flow

```
User Right-Click (give order)
    ↓
MovementController.onRightClick()
    ↓ (reads)
SelectionStateComponent.selectedEntities
    ↓ (for each selected entity)
Update NavigationComponent.target
    ↓
MovementSystem executes pathfinding
```

---

## Persistence & Synchronization

### Local-Only State

Selection state is **ephemeral and local** - it is not synchronized over P2P network.

**Rationale**:
- Selection is a UI state, not game state
- Each player has independent selection
- Commands derived from selection are what gets synchronized (not selection itself)

**Not Persisted**:
- `SelectableComponent.isSelected`
- `SelectionStateComponent.selectedEntities`
- `SelectionBox` UI state

**Persisted**:
- Unit entity IDs (part of World state)
- `SelectableComponent.ownerId` (part of entity state)

---

## Validation Rules

### Selection Constraints

1. **Owner Filter**: Only units with `SelectableComponent.ownerId == localPlayerId` can be selected
2. **Scale Filter**: Only units with `LocationComponent.viewScale == currentViewScale` can be selected
3. **Entity Existence**: Selected entity IDs must exist in `World.entities`
4. **Uniqueness**: `SelectionStateComponent.selectedEntities` is a Set (no duplicates)

### Integrity Checks

**On Scale Change**:
```typescript
// All selections must be cleared
assert(selectionState.selectedEntities.size === 0);
assert(allSelectableComponents.every(c => c.isSelected === false));
```

**On Entity Destruction**:
```typescript
// Entity must be removed from selection state
if (selectionState.isEntitySelected(deadEntity)) {
  selectionState.removeEntity(deadEntity);
  const selectable = world.getComponent(deadEntity, SelectableComponent);
  selectable.isSelected = false;
}
```

---

## Performance Considerations

### Memory Usage

| Component | Size per Instance | Max Instances | Total Memory |
|-----------|-------------------|---------------|--------------|
| SelectableComponent | ~24 bytes | 10,000 units | ~240 KB |
| SelectionStateComponent | ~8 bytes + Set overhead | 1 (singleton) | ~8 KB (for 500 selected) |
| InstancedMesh | 64 bytes per matrix | 1000 (max) | ~64 KB |

**Total**: ~312 KB (negligible)

### Update Frequency

| Operation | Frequency | Cost |
|-----------|-----------|------|
| Raycasting | On click (rare) | ~2ms |
| Box selection | On drag end (rare) | ~10ms |
| Circle position update | Every frame | ~1ms for 500 units |
| Selection state query | Every command (rare) | <0.1ms |

**Frame Budget**: <2ms per frame (selection rendering only)

---

## Edge Cases

### Destroyed Entity Still Selected

**Scenario**: Entity is destroyed while selected

**Handling**:
```typescript
// In entity destruction logic
world.destroyEntity(entity);

// Clean up selection state
const selectionState = getSelectionState(world);
if (selectionState.isEntitySelected(entity)) {
  selectionState.removeEntity(entity);
}
```

### Ownership Transfer

**Scenario**: Unit changes owner (e.g., captured)

**Handling**:
```typescript
// If unit no longer belongs to local player
if (selectable.ownerId !== localPlayerId && selectable.isSelected) {
  selectable.isSelected = false;
  selectionState.removeEntity(entity);
}
```

### Max Selection Exceeded

**Scenario**: User tries to select >1000 units (max InstancedMesh capacity)

**Handling**:
```typescript
// In SelectionRenderSystem
if (selectedEntities.length > this.maxInstances) {
  console.warn(`Selection exceeds max ${this.maxInstances}, only first ${this.maxInstances} will have visual feedback`);
  // Still maintain selection state, just limit rendering
}
```

---

## Testing Data

### Test Fixtures

```typescript
// Example test data for unit tests
export const mockSelectableEntity = {
  entityId: 1,
  components: {
    selectable: new SelectableComponent('player-1', false, -1),
    location: new LocationComponent(0, 0, 'system-1', 'Galaxy', {x: 0, y: 0, z: 0})
  }
};

export const mockSelectionState = new SelectionStateComponent();
mockSelectionState.addEntity(1);
mockSelectionState.addEntity(2);
// mockSelectionState.selectedEntities = Set {1, 2}
```

---

## API Summary

### Component Getters

```typescript
// Get selectable entities on current scale
const entities = world.getEntitiesWith(SelectableComponent, LocationComponent)
  .filter(e => {
    const loc = world.getComponent(e, LocationComponent);
    return loc.viewScale === currentScale;
  });

// Get selection state
const selectionState = getSelectionState(world);

// Get selected entities
const selected = selectionState.getSelectedEntities();
```

### Component Setters

```typescript
// Select an entity
const selectable = world.getComponent(entity, SelectableComponent);
selectable.isSelected = true;
selectionState.addEntity(entity);

// Deselect an entity
selectable.isSelected = false;
selectionState.removeEntity(entity);

// Clear all selections
selectionState.clearSelection();
world.getEntitiesWith(SelectableComponent).forEach(e => {
  const sel = world.getComponent(e, SelectableComponent);
  sel.isSelected = false;
});
```

---

**Data Model Status**: Complete ✅  
**Next Step**: Generate contracts/ (system interfaces)
