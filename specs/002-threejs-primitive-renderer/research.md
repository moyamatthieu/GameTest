# Research: Moteur de Rendu 3D (Three.js Primitives)

## R1: Performance des Primitives
- **Question**: Comment optimiser le rendu de centaines de primitives simples ?
- **Decision**: Utiliser des `Mesh` individuels pour les objets dynamiques (vaisseaux) et `Points` ou `InstancedMesh` pour les éléments statiques nombreux (étoiles).
- **Rationale**: Les vaisseaux sont composés de peu de primitives, donc le surcoût est négligeable. Pour les étoiles, `Points` est le plus performant.
- **Alternatives considered**: `InstancedMesh` pour les étoiles, mais `Points` est plus simple pour un fond étoilé uniforme.

## R2: Intégration de OrbitControls
- **Question**: Comment intégrer les contrôles de caméra sans polluer le `SceneManager` ?
- **Decision**: Injecter la caméra et le canvas dans `OrbitControls` au sein du `Renderer`. Désactiver les contrôles en production ou les lier à un mode "Debug".
- **Rationale**: Sépare la logique de rendu de la logique d'interaction.

## R3: Implémentation du Fond Étoilé
- **Question**: Quelle est la méthode la plus légère pour un fond étoilé ?
- **Decision**: Utiliser `THREE.Points` avec une `BufferGeometry` contenant des positions aléatoires dans une sphère géante.
- **Rationale**: Très faible consommation mémoire et GPU. Pas besoin de textures externes (Constitution VI).

## R4: Gestion du Redimensionnement (Resize)
- **Question**: Pattern standard pour le redimensionnement plein écran ?
- **Decision**: Écouter l'événement `resize` sur `window`, mettre à jour `camera.aspect`, `camera.updateProjectionMatrix()` et `renderer.setSize()`.
- **Rationale**: Assure que le canvas occupe toujours 100% du viewport sans distorsion.
