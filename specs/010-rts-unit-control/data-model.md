# Data Model: RTS Unit Selection and Command System

## Entities

### SelectionState
Represents the current local selection of the player.
- selectedEntityIds: Set<string> - IDs of entities currently selected.
- isSelecting: boolean - True if the player is currently dragging a selection box.
- startPoint: Vector2 - Screen coordinates where selection started.
- controlGroups: Map<number, string[]> - Mapping of keys 0-9 to lists of entity IDs.

### SelectableComponent (ECS)
Component attached to entities that can be selected.
- ownerId: string - ID of the player who owns the unit.
- isSelected: oolean - (Local only) Whether this unit is selected by the local player.
- selectionCircle: THREE.Mesh - Visual indicator (Torus/Ring primitive).

### Command (P2P)
The data structure sent over the network to peers.
- id: string - Unique command ID.
- issuer: string - Public key of the player.
- signature: string - Cryptographic signature.
- tick: number - Scheduled execution tick.
- type: CommandType (MOVE, ATTACK, HARVEST, STOP, PATROL).
- subjectIds: string[] - Units receiving the command.
- 	argetPosition: Vector3 - Destination or target location.
- 	argetEntityId: string? - Optional target entity (for attack/harvest).

## Relationships
- **Player** has one **SelectionState**.
- **Entity** has zero or one **SelectableComponent**.
- **Command** references multiple **Entities** via subjectIds.

## Validation Rules
- Only units owned by the issuer can be included in subjectIds.
- Commands must be signed by the issuer's private key.
- Commands must be received before their 	ick to be executed deterministically.
