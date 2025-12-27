# Renderer API Contracts

## SceneManager Interface

```typescript
interface ISceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  
  addObject(object: THREE.Object3D): void;
  removeObject(id: string): void;
  update(deltaTime: number): void;
  onResize(width: number, height: number): void;
}
```

## PrimitiveFactory Interface

```typescript
interface IPrimitiveFactory {
  createBox(width: number, height: number, depth: number, color: number): THREE.Mesh;
  createSphere(radius: number, color: number): THREE.Mesh;
  createShip(): THREE.Group; // Composite object
}
```

## Renderer Events

| Event | Payload | Description |
|-------|---------|-------------|
| `render:init` | `{ canvas: HTMLCanvasElement }` | Emitted when WebGL is ready |
| `render:error` | `{ message: string }` | Emitted if WebGL fails |
| `frame:update` | `{ deltaTime: number }` | Emitted every frame |
