# Data Model: P2P State Sync

## Entities

### RemotePlayer
Représente un joueur distant dans la session actuelle.

| Field | Type | Description |
|-------|------|-------------|
| `peerId` | `string` | Identifiant unique PeerJS du joueur. |
| `vessel` | `THREE.Object3D` | L'objet 3D représentant le vaisseau dans la scène. |
| `lastUpdate` | `number` | Timestamp de la dernière mise à jour reçue (pour le timeout). |
| `state` | `VesselState` | Position et rotation actuelles. |

### VesselState
Structure de données envoyée sur le réseau.

| Field | Type | Description |
|-------|------|-------------|
| `position` | `{x: number, y: number, z: number}` | Position dans l'espace. |
| `rotation` | `{x: number, y: number, z: number, w: number}` | Rotation (Quaternion). |

## State Transitions

1. **Discovery**: `ConnectionManager` émet `peer-connected` -> `RemotePlayerManager` crée un `RemotePlayer` et l'ajoute à la scène.
2. **Update**: `SyncService` reçoit `STATE_UPDATE` -> `RemotePlayerManager` met à jour la position/rotation du `RemotePlayer` correspondant.
3. **Removal**: `ConnectionManager` émet `peer-disconnected` (ou timeout) -> `RemotePlayerManager` supprime le `RemotePlayer` et retire l'objet de la scène.
