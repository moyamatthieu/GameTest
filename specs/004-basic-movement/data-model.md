# Data Model: Feature 004 - Basic Movement

## Entities

### InputState
Représente l'état actuel des touches de contrôle pressées par l'utilisateur.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `forward` | boolean | Touche 'W' (Poussée avant) |
| `backward` | boolean | Touche 'S' (Poussée arrière) |
| `yawLeft` | boolean | Touche 'A' (Lacet gauche) |
| `yawRight` | boolean | Touche 'D' (Lacet droit) |
| `pitchUp` | boolean | Touche 'R' (Tangage haut) |
| `pitchDown` | boolean | Touche 'F' (Tangage bas) |
| `rollLeft` | boolean | Touche 'Q' (Roulis gauche) |
| `rollRight` | boolean | Touche 'E' (Roulis droit) |
| `brake` | boolean | Touche 'Espace' (Freinage actif) |
| `turbo` | boolean | Touche 'Shift' (Accélération accrue) |

### PhysicsComponent
Composant ECS attaché au vaisseau pour gérer sa dynamique.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `velocity` | Vector3 | Vitesse linéaire actuelle |
| `angularVelocity` | Vector3 | Vitesse angulaire actuelle (x: pitch, y: yaw, z: roll) |
| `acceleration` | number | Force de poussée de base |
| `rotationSpeed` | number | Force de rotation de base |
| `drag` | number | Coefficient de traînée linéaire |
| `angularDrag` | number | Coefficient de traînée angulaire |
| `maxSpeed` | number | Vitesse linéaire maximale |
| `maxAngularSpeed` | number | Vitesse angulaire maximale |

## Relationships
- Un `PlayerEntity` possède un `PhysicsComponent` et un `TransformComponent` (Object3D).
- Le `MovementSystem` lit l'`InputState` global et met à jour le `PhysicsComponent` du joueur local.
