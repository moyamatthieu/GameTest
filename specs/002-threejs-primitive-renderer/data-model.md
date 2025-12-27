# Data Model: Moteur de Rendu 3D

## Entities

### RenderObject
Représente un objet 3D dans la scène, composé de primitives.
- **Fields**:
  - `id`: string (UUID)
  - `position`: Vector3
  - `rotation`: Euler
  - `scale`: Vector3
  - `primitives`: PrimitiveDefinition[]
- **Relationships**: Géré par le `SceneManager`.

### PrimitiveDefinition
Définition d'une forme géométrique simple.
- **Fields**:
  - `type`: 'box' | 'sphere' | 'cylinder' | 'cone'
  - `dimensions`: number[]
  - `color`: string (hex)
  - `offset`: Vector3 (position relative au parent)

### StarData
Données pour une étoile individuelle dans le Starfield.
- **Fields**:
  - `position`: Vector3
  - `size`: number
  - `brightness`: number

## State Transitions
- **Initialization**: `Renderer` -> `SceneManager` -> `Starfield`.
- **Object Creation**: `PrimitiveFactory.create(definition)` -> `SceneManager.add()`.
- **Frame Update**: `Renderer.animate()` -> `SceneManager.update()`.
