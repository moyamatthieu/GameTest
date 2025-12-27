# API Contracts: Combat P2P Messages

## Message Types

### FIRE_LASER
Envoyé par un pair lorsqu'il tire un laser.

```typescript
{
  "type": "FIRE_LASER",
  "payload": {
    "projectileId": "uuid-123",
    "origin": { "x": 0, "y": 0, "z": 0 },
    "direction": { "x": 0, "y": 0, "z": -1 },
    "speed": 500,
    "damage": 10
  },
  "timestamp": 1735123456789,
  "senderId": "peer-id-shooter"
}
```

### HIT_TARGET
Envoyé par le tireur lorsqu'il détecte un impact sur un autre pair.

```typescript
{
  "type": "HIT_TARGET",
  "payload": {
    "projectileId": "uuid-123",
    "targetId": "peer-id-victim",
    "damage": 10,
    "hitPosition": { "x": 10, "y": 5, "z": -100 }
  },
  "timestamp": 1735123456900,
  "senderId": "peer-id-shooter"
}
```

### HEALTH_SYNC
(Optionnel) Envoyé par un pair pour synchroniser son état de santé actuel s'il y a divergence.

```typescript
{
  "type": "HEALTH_SYNC",
  "payload": {
    "currentHp": 80,
    "isDead": false
  },
  "timestamp": 1735123457000,
  "senderId": "peer-id-victim"
}
```
