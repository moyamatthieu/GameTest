# Contracts: RTS Unit Selection System

This directory contains TypeScript interface definitions for all systems and components in the selection feature.

## Purpose

Contracts serve as:
- **API Documentation**: Clear specifications of public methods and parameters
- **Type Safety**: TypeScript interfaces for implementation
- **Testing Contracts**: Expectations for unit/integration tests
- **Architecture Reference**: System boundaries and responsibilities

## Files

### SelectionSystem.interface.ts

Defines the main selection logic system responsible for raycasting and box selection.

**Key Methods**:
- `selectAt()`: Single-click selection via raycasting
- `selectBox()`: Box selection via frustum culling
- `clearSelection()`: Clear all selections
- `onScaleChange()`: Handle multi-scale transitions

### SelectionRenderSystem.interface.ts

Defines the rendering system for selection circles (visual feedback).

**Key Methods**:
- `update()`: Update circle positions each frame
- `dispose()`: Clean up rendering resources

### InputHandler.interface.ts

Defines mouse input handling for selection operations.

**Key Responsibilities**:
- Differentiate click vs drag (5px threshold)
- Track Shift key for multi-select
- Convert screen coords to NDC
- Invoke SelectionSystem methods

### SelectionBox.interface.ts

Defines the HTML/CSS overlay for box selection visual feedback.

**Key Methods**:
- `show()`: Display box at given screen coordinates
- `hide()`: Hide box overlay
- `dispose()`: Remove from DOM

## Usage

### For Implementers

Use these interfaces as implementation guides:

```typescript
import { ISelectionSystem } from './contracts/SelectionSystem.interface';

export class SelectionSystem implements ISelectionSystem {
  // Implement all interface methods
  public selectAt(mousePos: { x: number; y: number }, multiSelect: boolean): void {
    // Implementation
  }
  
  // ... other methods
}
```

### For Testers

Use interfaces to write contract tests:

```typescript
import { ISelectionSystem } from './contracts/SelectionSystem.interface';

describe('SelectionSystem Contract', () => {
  let system: ISelectionSystem;
  
  it('should implement selectAt()', () => {
    expect(typeof system.selectAt).toBe('function');
  });
  
  it('should clear selection when selectAt called without multiSelect', () => {
    // Test behavior specified in contract
  });
});
```

### For Integration

Use interfaces for dependency injection:

```typescript
class CommandSystem {
  constructor(private selectionSystem: ISelectionSystem) {}
  
  public executeMoveOrder(target: Vector3): void {
    // Use interface, don't depend on concrete implementation
  }
}
```

## Contract Guarantees

All implementations **MUST**:

1. **Respect Parameter Contracts**: Accept parameters as specified
2. **Maintain Behavioral Contracts**: Follow documented behavior
3. **Handle Edge Cases**: As documented in interfaces
4. **Preserve Performance Targets**: Meet performance constraints

## Related Documentation

- [plan.md](../plan.md): Full architecture and design
- [data-model.md](../data-model.md): Component schemas
- [quickstart.md](../quickstart.md): Developer guide
- [research.md](../research.md): Technical decisions

---

**Status**: Complete ✅  
**Last Updated**: 2025-12-26
