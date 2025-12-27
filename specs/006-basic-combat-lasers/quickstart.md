# Quickstart: Feature 006: Basic Combat (Lasers)

## Setup pour le Développement

1. **Lancer le serveur de dev** :
   ```bash
   npm run dev
   ```
2. **Ouvrir deux onglets** :
   - Onglet 1 : `http://localhost:5173` (Joueur A)
   - Onglet 2 : `http://localhost:5173` (Joueur B)
3. **Connexion** :
   - Copier l'ID du Joueur A et le coller dans l'interface du Joueur B pour établir la connexion P2P.

## Comment Tester le Combat

1. **Tirer** :
   - Cliquez avec le **bouton gauche de la souris** ou appuyez sur **Ctrl**.
   - Vous devriez voir un laser rouge (ou blanc) partir de l'avant de votre vaisseau.
2. **Vérifier la synchronisation** :
   - Regardez l'écran du Joueur B pendant que le Joueur A tire. Le Joueur B doit voir les lasers du Joueur A.
3. **Infliger des dégâts** :
   - Orientez le vaisseau du Joueur A vers celui du Joueur B.
   - Tirez.
   - Observez la barre de vie du Joueur B (si implémentée dans l'UI) ou vérifiez les logs de la console pour confirmer la réception du message `HIT_TARGET` et la réduction des HP.
4. **Destruction** :
   - Continuez à tirer jusqu'à ce que les HP du Joueur B atteignent 0.
   - Le vaisseau du Joueur B doit disparaître de la scène.

## Debugging

- Les messages réseau peuvent être inspectés dans la console via le `ConnectionManager`.
- Utilisez `Helper.showRaycast()` (si disponible) pour visualiser les rayons de collision des lasers.
