# Research: Contrôles de Mouvement de Base (6DOF)

## Problématique
Implémenter un système de mouvement spatial à 6 degrés de liberté (6DOF) fluide, basé sur la physique, et intégré dans une architecture ECS.

## Findings

### 1. Modèle Physique 6DOF
Pour un vol spatial réaliste (type "Newtonian-lite") :
- **Translation** : Utilisation d'un vecteur `velocity`. L'accélération est appliquée selon l'axe local du vaisseau (Forward/Backward).
- **Rotation** : Utilisation de quaternions pour éviter le "Gimbal Lock". Les rotations (Pitch, Yaw, Roll) modifient la vitesse angulaire.
- **Traînée (Drag)** : Simulation d'une résistance pour éviter que le vaisseau ne dérive indéfiniment à haute vitesse, facilitant le gameplay.
- **Formules** :
  - `v = v + a * dt`
  - `p = p + v * dt`
  - `v = v * (1 - drag * dt)`

### 2. Architecture ECS
Bien que le projet n'ait pas de framework ECS lourd (comme `bitecs`), nous suivrons le pattern :
- **Component** : `PhysicsComponent` stockant `velocity`, `angularVelocity`, `maxSpeed`, `drag`.
- **System** : `MovementSystem` qui lit les inputs et met à jour les composants physiques et la `Transform` Three.js.

### 3. Gestion des Entrées (Input Polling)
L'utilisation d'événements `keydown`/`keyup` est préférable pour le polling dans la boucle de jeu (`requestAnimationFrame`).
- **Touches** : W/S (Thrust), A/D (Yaw), Q/E (Roll), R/F (Pitch), Space (Brake), Shift (Turbo).

### 4. Synchronisation Réseau
Le `SyncService` actuel diffuse déjà la position et la rotation à 10Hz. L'implémentation physique locale sera automatiquement répliquée tant qu'elle met à jour l'objet `ship` passé au `SyncService`.

## Decisions
- **D-001** : Utiliser `THREE.Quaternion` pour toutes les rotations.
- **D-002** : Implémenter un `MovementController` singleton ou injecté pour centraliser l'état du clavier.
- **D-003** : Séparer la logique de calcul physique (`PhysicsEngine`) de la logique ECS (`MovementSystem`) pour faciliter les tests unitaires.

## Alternatives considered
- **Raycasting pour le mouvement** : Rejeté, trop complexe pour du vol libre.
- **Utilisation d'un moteur physique externe (Cannon.js/Ammo.js)** : Rejeté pour le moment pour garder le projet léger, une implémentation custom simple suffit pour du 6DOF basique.
