# Research: P2P State Sync

## Sync Interval & Performance

- **Decision**: Intervalle de 100ms (10Hz).
- **Rationale**: Un équilibre entre la réactivité et la charge réseau. Pour un jeu spatial avec des mouvements relativement fluides, 10Hz est suffisant si on prévoit d'ajouter de l'interpolation plus tard. PeerJS/WebRTC peut supporter des fréquences plus hautes, mais cela augmenterait la consommation de bande passante inutilement pour cette phase.
- **Alternatives considered**: 
    - 60Hz (trop de messages, risque de congestion).
    - Basé sur les changements (diff-based) : Plus complexe à implémenter, sera considéré pour l'optimisation (Delta Compression).

## Serialization Format

- **Decision**: JSON simple pour commencer.
- **Rationale**: Facilité de débogage et intégration directe avec PeerJS qui gère déjà la sérialisation JSON par défaut.
- **Alternatives considered**: 
    - MessagePack : Plus compact, mais nécessite une dépendance supplémentaire. À envisager si la taille des messages devient un problème.
    - Protobuf : Trop lourd pour ce stade du projet.

## RemotePlayer Management

- **Decision**: `RemotePlayerManager` utilisant une `Map<string, Object3D>`.
- **Rationale**: Permet un accès O(1) aux vaisseaux distants via leur `peerId`. L'utilisation de `Object3D` (ou un wrapper) facilite l'intégration avec la scène Three.js.
- **Alternatives considered**: 
    - ECS pur : Idéalement, chaque joueur distant serait une entité dans un ECS. Cependant, le projet semble utiliser une approche hybride pour l'instant. On restera sur un manager simple pour coller à la structure actuelle.

## Connection Lifecycle

- **Decision**: Hook sur les événements `peer-connected` et `peer-disconnected` du `ConnectionManager`.
- **Rationale**: Assure que les vaisseaux sont créés et détruits en synchronisation avec l'état du réseau.
- **Alternatives considered**: 
    - Polling des connexions : Moins efficace que les événements.
