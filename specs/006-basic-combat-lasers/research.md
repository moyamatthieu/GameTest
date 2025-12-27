# Research: Feature 006: Basic Combat (Lasers)

## Collision Detection for Lasers

- **Decision**: Utilisation du **Raycasting** pour les lasers.
- **Rationale**: Les lasers se déplacent très rapidement. Une détection de collision basée sur la position (sphere-sphere) pourrait "sauter" par-dessus une cible entre deux frames (tunneling). Le raycasting entre la position précédente et la position actuelle garantit que toute intersection est détectée.
- **Alternatives considered**: 
    - *Sphere-Sphere Collision*: Plus simple mais sujet au tunneling pour les projectiles rapides.
    - *Physijs/Cannon.js*: Trop lourd pour un besoin aussi spécifique, on préfère une solution légère intégrée à Three.js.

## P2P Combat Synchronization

- **Decision**: **Shooter-side Hit Detection** avec validation par le récepteur.
- **Rationale**: Pour un retour visuel immédiat (responsiveness), le tireur calcule l'impact localement. Il envoie un message `HIT_TARGET` au pair touché. Le pair touché valide l'impact (vérifie si le laser pouvait effectivement le toucher à ce moment-là) avant de déduire ses HP.
- **Alternatives considered**:
    - *Target-side Hit Detection*: Moins de triche possible, mais latence ressentie par le tireur (le laser semble traverser la cible avant qu'elle n'explose).
    - *Consensus Validation*: Idéal selon la constitution, mais complexe à implémenter pour une première version. Sera ajouté en itération future.

## Laser Rendering

- **Decision**: Utilisation de **InstancedMesh** ou de simples **Cylindres étirés** (Mesh) avec un matériau `MeshBasicMaterial` émissif.
- **Rationale**: Pour un petit nombre de lasers, des Meshes individuels suffisent. Si le nombre augmente, on passera à `InstancedMesh` pour optimiser les appels de rendu (draw calls).
- **Alternatives considered**:
    - *THREE.Line*: Trop fin, ne permet pas de donner une épaisseur "lumineuse" satisfaisante sans shaders complexes.
    - *Sprite*: Difficile à orienter correctement dans la direction du tir.

## Health System Integration

- **Decision**: Création d'un `HealthComponent` dans le système ECS.
- **Rationale**: Permet de séparer la logique de survie de la logique de mouvement. Le `CombatSystem` écoutera les événements d'impact pour modifier le `HealthComponent`.
- **Alternatives considered**:
    - *Ajout de HP dans PhysicsComponent*: Mauvaise séparation des préoccupations (Separation of Concerns).
