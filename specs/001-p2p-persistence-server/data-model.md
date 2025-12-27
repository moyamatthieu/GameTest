# Data Model: Persistence Server

## Entities

### Snapshot
The core game state at a specific point in time.
- `clusterId: string`: The ID of the galactic cluster.
- `tick: number`: The game tick when the snapshot was taken.
- `state: any`: The serialized ECS world state.

### MutationLogEntry
An individual signed mutation to be appended to the journal.
- `clusterId: string`: The ID of the galactic cluster.
- `tick: number`: The game tick of the mutation.
- `action: any`: The signed RTS command or state delta.

### SignedPayload
A wrapper for any data sent to the server that requires verification.
- `payload: string`: The stringified JSON data (e.g., a Snapshot).
- `signature: string`: The Ed25519 signature (Base58 encoded).
- `publicKey: string`: The public key of the issuer (Base58 encoded).
- `timestamp: number`: To prevent replay attacks.

## Storage Structure (Filesystem)

Snapshots are stored in the `dataDir` using the following hierarchy:
```text
data/
└── snapshots/
    └── [clusterId]/
        ├── latest.json
        └── [timestamp].json
```

## Validation Rules
- **Signature**: `verify(payload + timestamp, signature, publicKey)` must be true.
- **Size**: Payload must be less than 5MB (configurable).
- **Rate Limit**: Maximum 1 snapshot per 5 minutes per cluster.
