# Quickstart: Feature 004 - Basic Movement

## Installation
Aucune dépendance supplémentaire n'est requise. Assurez-vous que `npm install` a été exécuté.

## Lancement
1. Démarrez le serveur de développement :
   ```bash
   npm run dev
   ```
2. Ouvrez votre navigateur sur `http://localhost:5173`.

## Contrôles
- **W / S** : Avancer / Reculer
- **A / D** : Lacet (Gauche / Droite)
- **R / F** : Tangage (Haut / Bas)
- **Q / E** : Roulis (Inclinaison Gauche / Droite)
- **Espace** : Freinage d'urgence
- **Shift** : Turbo (Post-combustion)

## Tests
Pour exécuter les tests unitaires de la logique physique :
```bash
npx vitest tests/unit/core/physics/
```

## Validation
- Le vaisseau doit avoir de l'inertie (ne pas s'arrêter instantanément).
- La vitesse doit être plafonnée.
- Le turbo doit augmenter visiblement l'accélération.
- Le freinage doit réduire la vitesse beaucoup plus vite que la traînée naturelle.
