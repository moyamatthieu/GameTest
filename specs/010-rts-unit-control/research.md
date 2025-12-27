# Research: RTS Unit Selection and Command System

## 1. Box Selection in Three.js

### Decision
Use SelectionBox and SelectionHelper from 	hree/examples/jsm/interactive/SelectionBox.js.

### Rationale
These utilities are built-in and handle the complex frustum math required to determine which objects are inside a screen-space rectangle.

### Implementation Pattern
`	ypescript
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox';
import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionBox';

const selectionBox = new SelectionBox(camera, scene);
const helper = new SelectionHelper(renderer, 'selectBox'); // 'selectBox' is a CSS class

window.addEventListener('pointerdown', (e) => {
    selectionBox.startPoint.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
        0.5
    );
});

window.addEventListener('pointerup', (e) => {
    selectionBox.endPoint.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
        0.5
    );
    const allSelected = selectionBox.select();
    // Filter for selectable units
});
`

## 2. Raycasting Optimization (1000+ Units)

### Decision
Implement a **2D Spatial Grid** for unit lookups.

### Rationale
Standard Raycaster.intersectObjects is (N)$. With 1000+ moving units, updating a BVH every frame is expensive. A 2D grid (since the game is top-down) allows (1)$ or (K)$ lookups by only checking units in the grid cells under the cursor.

### Alternatives Considered
- **three-mesh-bvh**: Excellent for static geometry (terrain), but slower for high-frequency updates of many moving objects.
- **GPU Picking**: Very fast but harder to implement for box selection and requires reading back from the GPU.

## 3. P2P Command Structure

### Decision
Use a signed JSON object with sequence numbers.

### Rationale
Ensures integrity (signatures), prevents replay attacks (sequence/tick), and supports deterministic execution.

### Structure
`	ypescript
interface RTSCommand {
    issuer: string;        // Public Key (Ed25519)
    signature: string;     // Hex/Base64 signature
    tick: number;          // Game tick for execution
    sequence: number;      // Per-player sequence number
    type: 'MOVE' | 'ATTACK' | 'HARVEST' | 'STOP' | 'PATROL';
    unitIds: string[];     // Entities to command
    target: {
        x: number,
        y: number,
        z: number,
        entityId?: string  // Optional target entity
    };
}
```

## 4. Contextual Action Logic

### Decision
Prioritized raycast check on right-click.

### Logic Flow
1. Raycast at cursor.
2. If hit Enemy -> ATTACK.
3. Else if hit Resource -> HARVEST.
4. Else if hit Friendly -> FOLLOW.
5. Else -> MOVE to ground coordinates.

## 5. Patrol and Stop Logic

### Decision
- **Stop**: Clears the unit's current command queue and sets state to IDLE.
- **Patrol**: Stores the `startPoint` (current position) and `endPoint` (target). The unit moves to `endPoint`, then automatically issues a new move command back to `startPoint` upon arrival, looping indefinitely.

### Rationale
Simple state machine transitions are easier to synchronize across P2P peers than complex behavior trees for basic RTS orders.
