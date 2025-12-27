# Quickstart: RTS Unit Selection and Command System

## Setup

1. **Selection Manager**: Initialize the `SelectionManager` in your main game loop.
2. **Input Handling**: Register the `InputHandler` to capture mouse and keyboard events.
3. **ECS Systems**: Add `SelectionSystem` and `CommandSystem` to the world.

## Usage

### Selecting Units
- **Single Click**: Left-click on a unit to select it.
- **Box Selection**: Click and drag the left mouse button to select multiple units.
- **Additive Selection**: Hold `Shift` while selecting to add to the current selection.

### Issuing Commands
- **Move**: Right-click on empty ground.
- **Attack**: Right-click on an enemy unit or press `A` + Left-click on ground (Attack-Move).
- **Stop**: Press `S` with units selected.
- **Patrol**: Press `P` + Left-click on ground.
- **Harvest**: Right-click on a resource node with cargo units selected.

### Control Groups
- **Create**: Select units and press `Ctrl` + `[0-9]`.
- **Recall**: Press `[0-9]` to select the saved group.

## Debugging
- Check the `SelectionState` singleton to see the current selection.
- Monitor the `CommandEvent` stream in the console to verify command emission.
- Visual indicators (circles) should appear under selected units.
