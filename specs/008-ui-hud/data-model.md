# Data Model: 008-ui-hud

## UI State

L'état de l'UI est principalement dérivé de l'état du monde ECS, mais certains éléments sont spécifiques à l'affichage.

### HUDState
Représente l'état actuel des éléments affichés à l'écran.

| Field | Type | Description |
|-------|------|-------------|
| `selectionHP` | `Array<{id: string, hp: number, maxHp: number}>` | Points de vie des entités actuellement sélectionnées. |
| `radarEntities` | `Array<RadarEntity>` | Liste des entités à afficher sur le radar. |
| `targetInfo` | `TargetInfo | null` | Informations sur la cible actuelle (dernière unité touchée). |

### RadarEntity
Représente une entité sur le radar.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | ID de l'entité. |
| `type` | `enum` | `planet`, `player`, `self`. |
| `relativePos` | `{x: number, y: number}` | Position relative au joueur (projetée en 2D). |

### TargetInfo
Informations sur la cible.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Nom ou ID de la cible. |
| `hp` | `number` | HP actuels de la cible. |
| `maxHp` | `number` | HP maximum de la cible. |

## State Transitions

1. **Update Loop**:
   - À chaque frame (ou intervalle régulier), le `HUDManager` interroge le `World` ECS et le `SelectionManager`.
   - Récupère le `HealthComponent` des entités sélectionnées.
   - Récupère les `LocationComponent` des entités proches pour le radar.
2. **Targeting**:
   - Lorsqu'un événement `ProjectileHit` est détecté (via un système de combat), l'ID de la cible est stocké.
   - Le `HUDManager` récupère les infos de cette entité pour mettre à jour `targetInfo`.
3. **Rendering**:
   - Les changements dans `HUDState` déclenchent des mises à jour du DOM (Vanilla JS).
