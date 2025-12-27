# Implementation Plan: RTS Unit Selection System

**Branch**: `011-rts-unit-selection` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-rts-unit-selection/spec.md`

## Summary

Implement a comprehensive RTS unit selection system enabling single-click selection, box selection, and Shift-based additive selection with visual feedback. The system uses Three.js raycasting for click detection, renders selection circles beneath units using RingGeometry, and supports multi-scale operation (Galaxy/System/Planet). Architecture leverages the existing ECS framework with SelectableComponent for state, SelectionSystem for logic, and SelectionRenderSystem for visual updates.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Three.js (3D rendering), PeerJS (P2P networking), Vitest (testing)  
**Storage**: N/A (ephemeral client-side state only)  
**Testing**: Vitest for unit/integration tests  
**Target Platform**: Web Browser (Desktop focus, mouse-driven RTS controls)
**Project Type**: Single-page web application  
**Performance Goals**: 60 FPS with 1000+ units on screen, box selection <500ms for 50 units  
**Constraints**: Selection circle updates <16ms/frame, raycasting <16ms, optimized spatial queries  
**Scale/Scope**: Support 1000+ simultaneous units, up to 500 units selected at once

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### RTS Paradigm Validation (NON-NEGOTIABLE)

✅ **Top-Down View**: Selection uses raycasting from top-down camera perspective  
✅ **Order-Based Control**: Selection is prerequisite for giving unit orders (Move, Attack)  
✅ **Pathfinding**: Not directly applicable - selection enables pathfinding commands  
✅ **ECS Architecture**: SelectableComponent + SelectionSystem + SelectionRenderSystem  
✅ **P2P Compatible**: Selection state is local-only, no network validation needed  
✅ **Deterministic**: Raycasting and selection logic are deterministic given same input  
✅ **RTS Controls**: Implements standard RTS box selection, single-click, Shift-add  
✅ **Construction**: Not applicable to selection system  
✅ **Persistence**: Selection state is ephemeral, does not require persistence  

**Gate Status**: ✅ PASSED - All constitution requirements met

## Project Structure

### Documentation (this feature)

```
specs/011-rts-unit-selection/
├── plan.md              # This file
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (component schemas)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (system interfaces)
│   ├── SelectionSystem.interface.ts
│   ├── SelectionRenderSystem.interface.ts
│   └── InputHandler.interface.ts
└── tasks.md             # Phase 2 output (NOT created by plan command)
```

### Source Code (repository root)

```
src/
├── ecs/
│   ├── components/
│   │   ├── SelectableComponent.ts        # EXISTS - needs refactor
│   │   ├── SelectionComponent.ts         # EXISTS - deprecated, remove
│   │   └── SelectionStateComponent.ts    # NEW - global selection state
│   └── systems/
│       ├── SelectionSystem.ts            # EXISTS - needs major refactor
│       └── SelectionRenderSystem.ts      # NEW - visual feedback logic
├── core/
│   └── renderer/
│       └── SceneManager.ts               # EXISTS - provides scene/camera access
└── ui/
    ├── input/
    │   ├── MovementController.ts         # EXISTS - handles keyboard
    │   └── SelectionInputHandler.ts      # NEW - mouse events for selection
    └── overlay/
        └── SelectionBox.ts               # NEW - box selection UI element

tests/
├── unit/
│   └── ecs/
│       └── systems/
│           ├── SelectionSystem.test.ts            # EXISTS - needs update
│           └── SelectionRenderSystem.test.ts      # NEW
└── integration/
    └── selection/
        ├── SingleSelection.test.ts       # NEW
        ├── BoxSelection.test.ts          # NEW
        └── AdditiveSelection.test.ts     # NEW
```

**Structure Decision**: Single project structure. All selection logic lives in ECS systems, input handling in ui/input, visual overlays in ui/overlay. This aligns with existing project architecture and RTS constitution (ECS-based).

---

## Phase 0: Research & Technical Decisions

### Research Topics

1. **Three.js Raycasting for Unit Selection**
2. **Box Selection Implementation Patterns**
3. **Selection Circle Rendering Performance**
4. **Multi-Scale Selection Architecture**

### 1. Three.js Raycasting for Unit Selection

**Context**: Need to determine which unit(s) the player clicks on in 3D space.

**Decision**: Use `THREE.Raycaster` with mouse NDC coordinates

**Rationale**:
- Three.js provides `Raycaster.setFromCamera(mouseNDC, camera)` for converting 2D mouse position to 3D ray
- `Raycaster.intersectObjects(scene.children, recursive=true)` returns all intersected objects sorted by distance
- Existing SelectionSystem already uses this pattern (src/ecs/systems/SelectionSystem.ts)
- Efficient for single-click selection (O(n) where n = renderable objects)

**Performance Considerations**:
- Raycasting scales with mesh complexity (use bounding boxes for initial culling)
- For 1000 units, expect ~1-2ms per raycast on modern hardware
- Cache raycaster instance (don't create on every click)

**Alternatives Considered**:
- Pixel picking via GPU readback: Rejected (async, slower, overkill for RTS)
- 2D screen-space collision: Rejected (doesn't respect 3D depth, incorrect for overlapping units)

### 2. Box Selection Implementation Patterns

**Context**: Need to select all units within a dragged rectangle efficiently.

**Decision**: Screen-space box with world-space frustum culling

**Rationale**:
- Draw selection rectangle in screen coordinates (2D overlay via HTML/CSS or Canvas2D)
- Convert screen-space box corners to world-space frustum
- Use frustum to cull entities (check if unit position is inside frustum)
- More efficient than raycasting every unit (O(n) single frustum check vs O(n * m) raycasts)

**Performance Considerations**:
- Frustum test is ~0.1ms per 100 units (very fast)
- Box selection of 500 units completes in <50ms (well under 500ms target)
- Spatial partitioning (e.g., octree) could further optimize but not needed for 1000 units

**Alternatives Considered**:
- Raycast grid of points: Rejected (slower, complex, misses units between rays)
- 2D bounding box in screen space: Rejected (doesn't respect 3D depth)
- GPU-based selection buffer: Rejected (overkill, adds complexity)

### 3. Selection Circle Rendering Performance

**Context**: Need to render selection circles beneath all selected units at 60 FPS.

**Decision**: Use instanced `THREE.RingGeometry` with `THREE.InstancedMesh`

**Rationale**:
- `RingGeometry` provides perfect circle outline (customizable inner/outer radius)
- `InstancedMesh` allows rendering many circles in a single draw call
- Update instance matrices each frame with unit positions
- Existing implementation uses per-unit Mesh (inefficient)

**Performance Considerations**:
- Single draw call for all circles (vs 1000 draw calls)
- Matrix updates are ~0.05ms per 100 units
- 500 selected units: ~0.25ms/frame (well under 16ms budget)

**Alternatives Considered**:
- Individual Mesh per unit: Rejected (current implementation, 1000 draw calls = slow)
- Decal projection: Rejected (complex shader setup, no performance benefit)
- Custom shader with point sprites: Rejected (overkill, harder to maintain)

### 4. Multi-Scale Selection Architecture

**Context**: Selection must work across Galaxy, System, Planet scales with different unit types.

**Decision**: ViewScale-aware filtering in SelectionSystem

**Rationale**:
- Units have `LocationComponent` with `viewScale` field (already exists)
- SelectionSystem queries entities matching current active scale
- Selection state is cleared on scale transition (per spec requirements)
- Each scale has different raycasting targets (galaxy icons, system ships, planet buildings)

**Performance Considerations**:
- Filtering by scale reduces raycasting candidates (e.g., 100 galaxy units vs 1000 planet units)
- No performance penalty compared to single-scale implementation

**Alternatives Considered**:
- Separate SelectionSystem per scale: Rejected (code duplication, harder to maintain)
- Layer-based rendering: Rejected (doesn't solve selection logic, only visual organization)

---

## Phase 1: Design & Architecture

### Component Architecture

#### 1. SelectableComponent (refactor existing)

**Purpose**: Marks an entity as selectable and stores owner information

**Schema**:
```typescript
export class SelectableComponent implements Component {
  constructor(
    public ownerId: string,        // Player ID who owns this unit
    public isSelected: boolean = false, // Selection state
    public selectionCircleIndex: number = -1 // Index in instanced mesh (-1 = not rendered)
  ) {}
}
```

**Changes from existing**:
- Remove `selectionCircle: THREE.Mesh` field (replaced by instanced rendering)
- Add `selectionCircleIndex` to track position in InstancedMesh
- Keep `ownerId` and `isSelected` as-is

#### 2. SelectionStateComponent (new, singleton)

**Purpose**: Global selection state accessible to command systems

**Schema**:
```typescript
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
  
  public getSelectedCount(): number;
  public hasSelection(): boolean;
  public clearSelection(): void;
  public addEntity(entity: Entity): void;
  public removeEntity(entity: Entity): void;
  public toggleEntity(entity: Entity): void;
}
```

### System Architecture

#### SelectionSystem (major refactor)

**Responsibilities**:
- Handle raycasting for single-click selection
- Handle frustum culling for box selection
- Update SelectableComponent.isSelected state
- Update SelectionStateComponent.selectedEntities set
- Filter by ViewScale and ownerId (player-owned only)

**Interface**:
```typescript
export class SelectionSystem {
  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private world: World
  ) {}
  
  public selectAt(mousePos: { x: number, y: number }, multiSelect: boolean): void;
  public selectBox(startPos: { x: number, y: number }, endPos: { x: number, y: number }, multiSelect: boolean): void;
  public clearSelection(): void;
  public onScaleChange(newScale: ViewScale): void;
  public update(deltaTime: number): void;
}
```

#### SelectionRenderSystem (new)

**Responsibilities**:
- Manage instanced mesh for selection circles
- Update circle positions each frame based on SelectableComponent.isSelected
- Handle circle color/animation

**Interface**:
```typescript
export class SelectionRenderSystem {
  private instancedCircles: THREE.InstancedMesh;
  private readonly maxInstances = 1000;
  
  constructor(private scene: THREE.Scene, private world: World) {}
  
  public update(deltaTime: number): void;
  public dispose(): void;
}
```

### Input Handling Architecture

#### SelectionInputHandler (new)

**Responsibilities**:
- Listen to mouse events (mousedown, mousemove, mouseup)
- Differentiate between click and drag (5px threshold)
- Track Shift key state for multi-select
- Call SelectionSystem methods with appropriate parameters

**Interface**:
```typescript
export class SelectionInputHandler {
  private isDragging = false;
  private dragThreshold = 5; // pixels
  
  constructor(private canvas: HTMLCanvasElement, private selectionSystem: SelectionSystem) {}
  
  private onMouseDown(event: MouseEvent): void;
  private onMouseMove(event: MouseEvent): void;
  private onMouseUp(event: MouseEvent): void;
  private screenToNDC(screenX: number, screenY: number): { x: number, y: number };
  public dispose(): void;
}
```

### Data Flow Diagrams

**Single Click Selection**:
```
User Click → SelectionInputHandler → screenToNDC() → SelectionSystem.selectAt()
  → Raycaster.intersectObjects() → Find entity → Check SelectableComponent
  → Update isSelected → Update SelectionStateComponent → Next frame: SelectionRenderSystem updates circles
```

**Box Selection**:
```
User Drag → SelectionInputHandler tracks drag → Show SelectionBox overlay
  → Mouse Up → SelectionSystem.selectBox() → Create frustum from box corners
  → Test each entity position against frustum → Update selected entities
  → Next frame: SelectionRenderSystem updates circles
```

### Integration Points

1. **main.ts**: Replace existing mouse listener with SelectionInputHandler, add SelectionRenderSystem to game loop
2. **SceneManager**: Add getCurrentViewScale() method and scale change event
3. **MovementController**: No changes (independent systems)

### Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Raycasting performance with 1000+ units** | Medium | High | Use spatial partitioning, limit raycast to visible frustum |
| **Frustum box selection inaccurate** | Medium | Medium | Test extensively, validate NDC-to-frustum conversion |
| **Selection circles z-fighting with ground** | High | Low | Offset circles by +0.1 units, use depthTest: false |
| **Multi-scale selection breaks** | Medium | Medium | Comprehensive integration tests for each scale |

---

## Next Steps

1. \u2705 **Phase 0 Complete**: Technical research documented above
2. \u2705 **Phase 1 Complete**: Architecture and design documented above
3. \u23f3 **Phase 1 Remaining**: Generate data-model.md, contracts/, quickstart.md
4. \u23f3 **Phase 2**: Run `/speckit.tasks` to generate detailed task breakdown
5. \u23f3 **Implementation**: Begin with Component refactoring (lowest risk)

---

**Plan Status**: Phase 0 & Phase 1 Planning Complete \u2705  
**Constitution Gates**: All Passed \u2705  
**Ready for**: data-model.md generation, then tasks.md generation
