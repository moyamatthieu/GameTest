# Research: Suivi de caméra pour le vaisseau du joueur

## Interpolation et Fluidité (Three.js)

### Options considérées
1. **Vector3.lerp()**: Simple à implémenter. `camera.position.lerp(targetPosition, alpha)`.
   - *Problème*: Dépend de la fréquence d'images si `alpha` est fixe.
   - *Solution*: Utiliser `1 - Math.exp(-speed * deltaTime)` pour l'alpha.
2. **Damping (Amortissement)**: Plus naturel, évite les arrêts brusques.
3. **Spring-Damper**: Très fluide, permet des effets de ressort (inertie).

### Décision
Utilisation de **Vector3.lerp** avec un alpha corrigé par le `deltaTime` pour la V1 (Chase Cam). C'est le plus simple et suffisant pour un suivi de vaisseau spatial. Pour le mode Cockpit, aucune interpolation ne sera utilisée pour garantir une précision absolue.

**Rationale**: Simplicité d'implémentation et performance. L'alpha exponentiel garantit la fluidité indépendamment du FPS.

---

## Gestion des Modes de Caméra

### Options considérées
1. **State Pattern**: Chaque mode est une classe séparée.
2. **Switch Case**: Une seule classe `CameraController` avec un switch dans la méthode `update()`.

### Décision
**Switch Case** au sein d'une classe `CameraController`.

**Rationale**: Le nombre de modes est limité (3) et la logique de chaque mode est relativement courte. Un State Pattern serait une sur-ingénierie à ce stade.

---

## Intégration avec le Système Existant

### Analyse
Le projet utilise une structure où le `Renderer` gère la scène Three.js. Le `main.ts` orchestre la boucle de jeu.
Le vaisseau du joueur est géré par le `PhysicsEngine` et synchronisé.

### Décision
Le `CameraController` sera instancié dans le `Renderer`. Il recevra la caméra Three.js et une référence à l'objet cible (le vaisseau). La mise à jour se fera dans la boucle `requestAnimationFrame` du `Renderer` ou via un appel explicite depuis `main.ts`.

---

## Entrées Utilisateur (Mode Orbite)

### Analyse
Le `MovementController` gère déjà les entrées clavier/souris pour le vaisseau.

### Décision
Ajouter un écouteur pour la touche 'C' (Camera) dans `MovementController` ou `main.ts` pour basculer entre les modes. Le mode Orbite utilisera les mouvements de souris (quand un bouton est maintenu ou via le pointeur lock) pour modifier les angles d'azimut et d'élévation.
