# Data Model: 001-p2p-peerjs-connection

## Entities

### Identity
Represents the player's cryptographic identity.

| Field | Type | Description |
|-------|------|-------------|
| `publicKey` | `Uint8Array` (32 bytes) | The Ed25519 public key. |
| `secretKey` | `Uint8Array` (64 bytes) | The Ed25519 secret key (private). |
| `peerId` | `string` | Base58 encoded public key. |

**Validation Rules**:
- `publicKey` must be derived from `secretKey`.
- `peerId` must be the Base58 representation of `publicKey`.

**Persistence**:
- Stored in `localStorage` under the key `specify_identity`.
- Format: JSON object with hex-encoded strings for keys.

### PeerConnection
Represents an active P2P connection to another player.

| Field | Type | Description |
|-------|------|-------------|
| `remotePeerId` | `string` | The ID of the connected peer. |
| `status` | `enum` | `connecting`, `connected`, `disconnected`, `error`. |
| `lastSeen` | `number` | Timestamp of the last received message. |

## State Transitions

1. **Initialization**:
   - Check `localStorage`.
   - If empty: Generate new Ed25519 pair -> Store.
   - If exists: Load keys.
2. **Network Setup**:
   - Initialize `PeerJS` with `peerId`.
   - Transition status to `online` when `peer.on('open')` fires.
3. **Connection Flow**:
   - `connect(targetId)` -> status `connecting`.
   - `peer.on('connection')` or `conn.on('open')` -> status `connected`.
   - `conn.on('close')` -> status `disconnected`.
