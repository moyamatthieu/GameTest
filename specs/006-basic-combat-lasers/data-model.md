# Data Model: Feature 006: Basic Combat (Lasers)

## Entities

### Laser (Projectile)
Représente un tir de laser en vol.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Identifiant unique du projectile. |
| `ownerId` | `string` | ID du joueur/vaisseau ayant tiré. |
| `position` | `Vector3` | Position actuelle dans l'espace. |
| `direction` | `Vector3` | Vecteur normalisé de direction. |
| `speed` | `number` | Vitesse du projectile (unités/s). |
| `damage` | `number` | Points de dégâts infligés à l'impact. |
| `lifetime` | `number` | Temps restant avant disparition (s). |

## Components (ECS)

### HealthComponent
Gère l'état de santé d'une entité.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `currentHp` | `number` | Points de vie actuels. |
| `maxHp` | `number` | Points de vie maximum. |
| `isDead` | `boolean` | État de l'entité. |

### WeaponComponent
Gère les capacités de tir d'un vaisseau.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `lastFired` | `number` | Timestamp du dernier tir. |
| `fireRate` | `number` | Nombre de tirs max par seconde (ex: 5). |
| `projectileSpeed` | `number` | Vitesse des projectiles émis. |

## State Transitions

1. **Tir** : `WeaponComponent` vérifie le `fireRate` -> Création d'une entité `Laser` -> Envoi message `FIRE_LASER`.
2. **Vol** : `ProjectileSystem` met à jour la `position` du `Laser` -> Test de collision via Raycast.
3. **Impact** : Collision détectée -> Suppression du `Laser` -> Envoi message `HIT_TARGET`.
4. **Dégâts** : Réception `HIT_TARGET` -> Mise à jour `HealthComponent.currentHp` -> Si <= 0, `isDead = true`.
