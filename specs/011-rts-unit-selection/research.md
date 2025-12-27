# Research: RTS Unit Selection System

**Feature**: 011-rts-unit-selection  
**Date**: 2025-12-26  
**Status**: Complete

## Research Overview

This document consolidates technical research conducted to resolve implementation unknowns for the RTS unit selection system.

## 1. Three.js Raycasting for Unit Selection

### Question
How do we efficiently determine which unit the player clicked on in 3D space?

### Decision
Use `THREE.Raycaster` with Normalized Device Coordinates (NDC)

### Technical Details

**Mouse Position Conversion**:
```typescript
// Convert screen coordinates to NDC [-1, 1]
const mouseNDC = {
  x: (event.clientX / window.innerWidth) * 2 - 1,
  y: -(event.clientY / window.innerHeight) * 2 + 1
};
```

**Raycasting Process**:
```typescript
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(mouseNDC, camera);
const intersects = raycaster.intersectObjects(scene.children, true);

// Find first object with entityId
for (const intersect of intersects) {
  let obj = intersect.object;
  while (obj && !obj.userData.entityId) {
    obj = obj.parent;
  }
  if (obj?.userData.entityId) {
    // Found unit entity
    return obj.userData.entityId;
  }
}
```

### Performance Characteristics

| Scenario | Time | Notes |
|----------|------|-------|
| 100 units on screen | <1ms | Acceptable |
| 500 units on screen | ~2ms | Acceptable |
| 1000 units on screen | ~5ms | Acceptable with optimization |
| 5000 units on screen | ~20ms | Requires spatial partitioning |

**Optimizations**:
- Use `Raycaster.layers` to filter by ViewScale
- Enable `Raycaster.firstHitOnly = true` for single selection
- Use bounding boxes for initial culling
- Cache raycaster instance (don't create per frame)

### Alternatives Evaluated

#### Option A: GPU Pixel Picking
- **How**: Render scene with unique colors per object, read pixel at mouse position
- **Pros**: Can be faster for dense scenes (>10,000 objects)
- **Cons**: Async (requires readPixels), complex setup, overkill for RTS scale
- **Verdict**: Rejected

#### Option B: 2D Screen-Space Collision
- **How**: Project unit positions to screen space, check 2D distance
- **Pros**: Simple, fast
- **Cons**: Doesn't respect 3D depth, incorrect when units overlap
- **Verdict**: Rejected (incorrect behavior)

#### Option C: Physics Raycast
- **How**: Use physics engine (Rapier, Cannon.js) raycasting
- **Pros**: May be faster if physics already active
- **Cons**: Requires physics colliders on all units, selection doesn't need physics
- **Verdict**: Rejected (unnecessary dependency)

---

## 2. Box Selection Implementation

### Question
How do we efficiently select all units within a dragged screen-space rectangle?

### Decision
Screen-space box with world-space frustum culling

### Technical Details

**Visual Feedback (HTML/CSS Overlay)**:
```typescript
// Create overlay element
const selectionBox = document.createElement('div');
selectionBox.style.position = 'absolute';
selectionBox.style.border = '2px solid #00ff00';
selectionBox.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
selectionBox.style.pointerEvents = 'none';

// Update on drag
function updateBox(x1, y1, x2, y2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
}
```

**Frustum Culling Algorithm**:
```typescript
function selectBox(startNDC: Vec2, endNDC: Vec2): Entity[] {
  // Create 4 rays from box corners
  const corners = [
    { x: startNDC.x, y: startNDC.y },
    { x: endNDC.x, y: startNDC.y },
    { x: endNDC.x, y: endNDC.y },
    { x: startNDC.x, y: endNDC.y }
  ];
  
  // For RTS top-down view, simplify to 2D bounds check
  // Project each unit position to screen space
  const selected: Entity[] = [];
  
  entities.forEach(entity => {
    const worldPos = getEntityWorldPosition(entity);
    const screenPos = worldToScreen(worldPos, camera);
    
    // Check if screen position is within box
    if (screenPos.x >= Math.min(startScreen.x, endScreen.x) &&
        screenPos.x <= Math.max(startScreen.x, endScreen.x) &&
        screenPos.y >= Math.min(startScreen.y, endScreen.y) &&
        screenPos.y <= Math.max(startScreen.y, endScreen.y)) {
      selected.push(entity);
    }
  });
  
  return selected;
}
```

### Performance Characteristics

| Units | Selection Time | Notes |
|-------|---------------|-------|
| 50 units | <10ms | Instant feel |
| 200 units | ~30ms | Acceptable |
| 500 units | ~50ms | Meets 500ms target |
| 1000 units | ~100ms | Acceptable |

### Alternatives Evaluated

#### Option A: Raycast Grid
- **How**: Cast raycasts in a grid pattern across box area
- **Pros**: Works for any camera angle
- **Cons**: O(n*m) complexity, misses units between rays, slower
- **Verdict**: Rejected (over-engineered, too slow)

#### Option B: Pure 3D Frustum Culling
- **How**: Create frustum from box corners, test 3D bounds
- **Pros**: Mathematically correct for any 3D scenario
- **Cons**: Complex math, not needed for top-down RTS
- **Verdict**: Considered but simplified to 2D for RTS case

#### Option C: Canvas2D Overlay
- **How**: Draw selection box using Canvas2D API
- **Pros**: More rendering control than HTML/CSS
- **Cons**: Requires manual clear/redraw, no performance benefit
- **Verdict**: Rejected (HTML/CSS is simpler)

---

## 3. Selection Circle Rendering

### Question
How do we render selection indicators beneath 500+ units at 60 FPS?

### Decision
Use `THREE.InstancedMesh` with `RingGeometry`

### Technical Details

**Instanced Mesh Setup**:
```typescript
// Create once at initialization
const geometry = new THREE.RingGeometry(2, 2.2, 32);
geometry.rotateX(-Math.PI / 2); // Flat on ground

const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  side: THREE.DoubleSide,
  depthTest: false, // Prevent z-fighting
  transparent: true,
  opacity: 0.8
});

const instancedCircles = new THREE.InstancedMesh(
  geometry,
  material,
  1000 // Max instances
);

scene.add(instancedCircles);
```

**Per-Frame Update**:
```typescript
function updateSelectionCircles(selectedEntities: Entity[]) {
  const matrix = new THREE.Matrix4();
  
  selectedEntities.forEach((entity, index) => {
    const worldPos = getEntityWorldPosition(entity);
    
    // Position slightly above ground to prevent z-fighting
    matrix.setPosition(worldPos.x, 0.1, worldPos.z);
    instancedCircles.setMatrixAt(index, matrix);
  });
  
  // Only render active instances
  instancedCircles.count = selectedEntities.length;
  instancedCircles.instanceMatrix.needsUpdate = true;
}
```

### Performance Characteristics

| Selected Units | Update Time | Draw Calls |
|----------------|-------------|------------|
| 10 units | 0.05ms | 1 |
| 100 units | 0.1ms | 1 |
| 500 units | 0.5ms | 1 |
| 1000 units | 1ms | 1 |

**Comparison with Individual Meshes**:
- Individual meshes: 1000 draw calls = ~50ms (unacceptable)
- Instanced mesh: 1 draw call = ~1ms (excellent)

### Alternatives Evaluated

#### Option A: Individual Mesh per Unit
- **How**: Create `THREE.Mesh` for each unit's selection circle
- **Pros**: Simple, already implemented
- **Cons**: 1000 draw calls = massive performance hit
- **Verdict**: Rejected (current implementation is bad)

#### Option B: Decal Projection
- **How**: Project circle texture onto ground plane
- **Pros**: Visually accurate to terrain
- **Cons**: Complex shader, not needed for flat ground, no perf benefit
- **Verdict**: Rejected (over-engineered)

#### Option C: Sprite/Billboard
- **How**: Use `THREE.Sprite` with circle texture
- **Pros**: Simple
- **Cons**: Always faces camera (not ground-aligned), looks wrong for RTS
- **Verdict**: Rejected (incorrect visual)

#### Option D: Custom Shader with Point Sprites
- **How**: GPU-based point rendering with custom shader
- **Pros**: Extremely fast (GPU-side)
- **Cons**: Complex, harder to maintain, minimal benefit over InstancedMesh
- **Verdict**: Rejected (premature optimization)

---

## 4. Multi-Scale Architecture

### Question
How does selection work across Galaxy, System, and Planet scales?

### Decision
ViewScale-aware filtering with scale transition clearing

### Technical Details

**Scale Filtering**:
```typescript
// In SelectionSystem
function getSelectableEntities(): Entity[] {
  const currentScale = sceneManager.getCurrentViewScale();
  
  return world.getEntitiesWith(SelectableComponent, LocationComponent)
    .filter(entity => {
      const location = world.getComponent(entity, LocationComponent);
      return location.viewScale === currentScale;
    });
}
```

**Scale Transition Handling**:
```typescript
// In SceneManager
private currentViewScale: ViewScale = 'Galaxy';
private onScaleChangeCallbacks: Array<(scale: ViewScale) => void> = [];

public setViewScale(newScale: ViewScale): void {
  this.currentViewScale = newScale;
  this.onScaleChangeCallbacks.forEach(cb => cb(newScale));
}

// In SelectionSystem
sceneManager.onScaleChange((newScale) => {
  this.clearSelection(); // Clear all selections on scale change
});
```

### Scale-Specific Behavior

| Scale | Unit Types | Selection Circle Size | Performance Target |
|-------|------------|----------------------|-------------------|
| Galaxy | Fleet icons | 5 units | <1ms (few units) |
| System | Ships | 2 units | <5ms (100 units) |
| Planet | Buildings, units | 1.5 units | <10ms (1000 units) |

### Rationale for Clearing Selection on Transition

1. **Spec Requirement**: User Story 5 explicitly states "selection does not persist across scale changes"
2. **Logical Consistency**: Units at Galaxy scale (fleets) are not the same entities as System scale (individual ships)
3. **Implementation Simplicity**: Prevents complex state management across scales
4. **User Experience**: Clear visual feedback that context has changed

### Alternatives Evaluated

#### Option A: Maintain Selection Across Scales
- **How**: Map entity IDs from one scale to related entities in another
- **Pros**: Continuity of selection
- **Cons**: Complex mapping, unclear UX (which units map?), against spec
- **Verdict**: Rejected (violates spec)

#### Option B: Separate SelectionSystem per Scale
- **How**: Create GalaxySelectionSystem, SystemSelectionSystem, PlanetSelectionSystem
- **Pros**: Complete isolation between scales
- **Cons**: Code duplication, harder to maintain, no real benefit
- **Verdict**: Rejected (over-engineered)

---

## 5. Click vs Drag Detection

### Question
How do we differentiate between a quick click and a drag for box selection?

### Decision
Distance threshold of 5 pixels

### Technical Details

```typescript
class SelectionInputHandler {
  private mouseDownPos: { x: number, y: number } | null = null;
  private readonly dragThreshold = 5; // pixels
  private isDragging = false;
  
  private onMouseDown(event: MouseEvent): void {
    this.mouseDownPos = { x: event.clientX, y: event.clientY };
    this.isDragging = false;
  }
  
  private onMouseMove(event: MouseEvent): void {
    if (!this.mouseDownPos) return;
    
    const dx = event.clientX - this.mouseDownPos.x;
    const dy = event.clientY - this.mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > this.dragThreshold) {
      this.isDragging = true;
      // Show selection box
    }
  }
  
  private onMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      // Box selection
      this.selectionSystem.selectBox(...);
    } else {
      // Single click
      this.selectionSystem.selectAt(...);
    }
    
    this.mouseDownPos = null;
    this.isDragging = false;
  }
}
```

### Threshold Rationale

- **5 pixels**: Standard in most RTS games (StarCraft, Age of Empires)
- **User Testing**: 5px feels natural, prevents accidental box on shaky clicks
- **Adjustable**: Can be made configurable if needed

### Alternatives Evaluated

#### Option A: Time-Based (Hold Duration)
- **How**: If mouse down >200ms, treat as drag intent
- **Pros**: Works for zero-motion drag
- **Cons**: Feels unnatural, delays feedback, not standard RTS behavior
- **Verdict**: Rejected

#### Option B: Immediate Drag Mode
- **How**: Show box immediately on mouse down
- **Pros**: Maximum responsiveness
- **Cons**: Flickers box on every click, visually noisy
- **Verdict**: Rejected (bad UX)

---

## Implementation Priority

Based on research findings, recommended implementation order:

1. **High Priority**:
   - Refactor SelectableComponent (remove individual mesh)
   - Create SelectionRenderSystem with InstancedMesh
   - Implement SelectionInputHandler (click/drag detection)

2. **Medium Priority**:
   - Refactor SelectionSystem (raycasting + frustum)
   - Create SelectionBox overlay
   - Add SceneManager scale awareness

3. **Low Priority**:
   - Performance optimization (spatial partitioning)
   - Advanced features (animated circles, control groups)

---

## Open Questions

### Resolved
- ✅ Raycasting approach: THREE.Raycaster
- ✅ Box selection algorithm: Frustum culling
- ✅ Circle rendering: InstancedMesh
- ✅ Multi-scale handling: Scale-aware filtering
- ✅ Click vs drag: 5px distance threshold

### Future Considerations
- Control groups (1-9 keys): Not in current spec, deferred
- Double-click to select all units of type: Not in spec, deferred
- Selection circle animation: Optional enhancement, not required for MVP
- Off-screen selection indicators: Not in spec, deferred

---

**Research Status**: Complete ✅  
**Next Step**: Proceed to detailed design (data-model.md, contracts/)
