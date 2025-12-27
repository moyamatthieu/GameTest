# P2P Message Contract: State Sync

## Message Types

### 1. `STATE_UPDATE`
Diffusé périodiquement par chaque pair pour informer les autres de sa position et rotation.

```typescript
interface StateUpdatePayload {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
}

interface StateUpdateMessage extends P2PMessage {
  type: 'STATE_UPDATE';
  payload: StateUpdatePayload;
}
```

**Exemple JSON :**

```json
{
  "type": "STATE_UPDATE",
  "senderId": "peer-123",
  "timestamp": 1735123456789,
  "payload": {
    "position": { "x": 10.5, "y": 0, "z": -5.2 },
    "rotation": { "x": 0, "y": 0.707, "z": 0, "w": 0.707 }
  }
}
```

## Validation Rules

- `position` : Les valeurs doivent être des nombres finis.
- `rotation` : Doit être un quaternion valide (la somme des carrés est proche de 1).
- `timestamp` : Doit être supérieur au timestamp du dernier message reçu pour ce `senderId` (protection contre le rejeu et les messages désordonnés).
