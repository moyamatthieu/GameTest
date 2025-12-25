# 🧪 Plan de Test - Validation de l'Architecture

## ✅ Tests Automatiques

### Test 1 : Vérifier que le Client ne Simule Pas
```bash
# Dans la console du navigateur (F12)
# Vérifier qu'aucun système de simulation n'est exécuté
console.log(game.world.systems)
# ✅ Doit afficher : []

# Vérifier que meshSync et buildingPlacer existent
console.log(game.meshSync)        # ✅ Doit exister
console.log(game.buildingPlacer)  # ✅ Doit exister
console.log(game.fleetSystem)     # ❌ Ne doit PAS exister
console.log(game.combatSystem)    # ❌ Ne doit PAS exister
```

### Test 2 : Synchronisation Client/Serveur
```bash
# Terminal 1 : Démarrer le serveur
cd server
npm start

# Terminal 2 : Démarrer le client
npm run dev

# Navigateur 1 : Ouvrir http://localhost:3000
# Navigateur 2 : Ouvrir http://localhost:3000 (onglet incognito)

# Dans Navigateur 1 : Placer un bâtiment
# ✅ Le bâtiment doit apparaître dans les deux navigateurs
# ✅ Les ressources doivent se synchroniser
```

### Test 3 : Validation Serveur
```bash
# Dans la console du navigateur
const economy = game.world.getComponent(game.playerEntity, 'Economy')
console.log('Métal initial:', economy.metal)

# Modifier localement (hack)
economy.metal = 99999

# Essayer de placer un bâtiment coûteux (Mine = 120)
# ✅ Le serveur doit rejeter si les vraies ressources sont insuffisantes
# ⚠️ Regarder la console Node.js pour le message de rejet
```

---

## 🔍 Tests Manuels

### Scénario 1 : Cycle Complet de Jeu

1. **Démarrer le jeu**
   ```bash
   npm run dev:all
   ```

2. **Placer des bâtiments**
   - Mine (120 métal)
   - Centrale (80 métal)
   - Usine (60 métal)
   - ✅ Vérifier que les ressources diminuent
   - ✅ Vérifier que les bâtiments apparaissent visuellement

3. **Attendre la production**
   - Observer l'UI des ressources
   - ✅ Le métal doit augmenter (production de la mine)
   - ✅ L'énergie doit augmenter (production de la centrale)

4. **Changer de scène**
   - Appuyer sur `2` (Système)
   - Appuyer sur `3` (Galaxie)
   - Appuyer sur `1` (Planète)
   - ✅ Les bâtiments doivent rester visibles en scène Planète
   - ✅ Les ressources doivent persister

5. **Redémarrer le serveur**
   ```bash
   # Ctrl+C dans le terminal serveur
   npm start
   ```
   - ✅ Recharger le navigateur
   - ✅ Les bâtiments doivent réapparaître (persistence DB)

---

### Scénario 2 : Multi-Joueurs

1. **Ouvrir 2 navigateurs**
   - Chrome : http://localhost:3000
   - Firefox/Incognito : http://localhost:3000

2. **Joueur 1 : Placer un bâtiment**
   - ✅ Le bâtiment apparaît chez Joueur 2 en temps réel

3. **Joueur 2 : Utiliser des ressources**
   - ✅ Les ressources de Joueur 1 ne changent pas (isolation)

4. **Serveur : Vérifier l'état**
   ```javascript
   // Dans la console Node.js
   console.log('Total entities:', world.entities.size)
   for (const entity of world.entities) {
     console.log(`Entity ${entity}:`, 
       world.getComponent(entity, 'Position'),
       world.getComponent(entity, 'Building')
     )
   }
   ```

---

### Scénario 3 : Test de Charge

1. **Créer beaucoup d'entités**
   ```javascript
   // Dans la console Node.js
   for (let i = 0; i < 100; i++) {
     const entity = world.createEntity()
     world.addComponent(entity, 'Position', {
       x: Math.random() * 100,
       y: 0,
       z: Math.random() * 100
     })
     world.addComponent(entity, 'Building', { type: 'mine', level: 1 })
   }
   ```

2. **Observer les performances**
   - ✅ FPS client : Doit rester > 30 FPS
   - ✅ Tick serveur : Doit rester à 10 Hz constant
   - ✅ Mémoire client : Ne doit pas augmenter indéfiniment

3. **Ouvrir le Profiler**
   ```
   Chrome DevTools > Performance
   - Enregistrer 10 secondes
   - ✅ Vérifier qu'aucune fonction de simulation n'est appelée
   - ✅ Vérifier que MeshSync.update() est appelée à 60 FPS
   ```

---

## 🐛 Checklist de Non-Régression

### Client (src/)
- [ ] `game.world.systems` est vide
- [ ] `game.meshSync` existe et fonctionne
- [ ] `game.buildingPlacer` existe et fonctionne
- [ ] Aucune modification directe des composants dans Game.js
- [ ] Tous les inputs passent par NetworkManager

### Serveur (server/)
- [ ] `ServerWorld` a tous les systèmes (Economy, Combat, etc.)
- [ ] Validation des requêtes avant modification
- [ ] Persistence SQLite fonctionne
- [ ] Delta compression envoie uniquement les changements

### Réseau (NetworkManager)
- [ ] Utilise les IDs serveur directement
- [ ] Pas de mapping `serverToLocalEntity`
- [ ] Tous les événements socket sont gérés
- [ ] Gestion des déconnexions

---

## 📊 Métriques de Réussite

### Performance
- **Client FPS :** > 30 FPS avec 100 entités
- **Serveur Tick Rate :** 10 Hz stable
- **Latence Réseau :** < 100ms en local
- **Mémoire Client :** < 200 MB

### Fonctionnel
- **Synchronisation :** Délai < 200ms entre clients
- **Persistence :** 100% des entités restaurées après redémarrage
- **Validation :** 0% de requêtes invalides acceptées

### Code Quality
- **ESLint :** 0 erreurs
- **Prettier :** 100% formaté
- **Tests :** Tous les scénarios passent

---

## 🚨 Que Faire en Cas d'Échec ?

### Erreur : "game.meshSync is not a function"
**Cause :** MeshSync n'est pas initialisé
**Solution :**
```javascript
// src/core/Game.js - Vérifier que cette ligne existe
this.meshSync = new MeshSync(this.sceneManager, this.assetManager)
```

### Erreur : Bâtiments ne s'affichent pas
**Cause :** Composant `Renderable` manquant
**Solution :**
```javascript
// src/core/NetworkManager.js - syncWorld()
if (!this.game.world.hasComponent(entityId, 'Renderable')) {
  const building = this.game.world.getComponent(entityId, 'Building')
  if (building) {
    this.game.world.addComponent(entityId, 'Renderable', {
      type: 'building',
      buildingType: building.type,
      color: 0x808080
    })
  }
}
```

### Erreur : Désynchronisation Client/Serveur
**Cause :** Le client exécute encore de la logique
**Solution :**
```bash
# Rechercher dans le code
grep -r "world.addSystem" src/
# ✅ Ne doit retourner AUCUN résultat dans src/
```

### Erreur : "Cannot read property 'position' of undefined"
**Cause :** Mesh pas encore créé par MeshSync
**Solution :**
```javascript
// MeshSync.update() est asynchrone
// S'assurer qu'il est appelé AVANT le rendu
this.meshSync.update(this.world)  // D'abord créer les meshes
this.sceneManager.render(this.renderer)  // Puis rendre
```

---

## 📝 Rapport de Test (Template)

```markdown
### Test Date: [JJ/MM/AAAA]
**Testeur :** [Nom]
**Branche :** [main/refactor-client-server]
**Commit :** [SHA]

#### Scénario 1 : Cycle Complet
- [ ] Démarrage : ✅/❌
- [ ] Placement bâtiments : ✅/❌
- [ ] Production ressources : ✅/❌
- [ ] Changement scène : ✅/❌
- [ ] Persistence : ✅/❌

#### Scénario 2 : Multi-Joueurs
- [ ] Synchronisation : ✅/❌
- [ ] Isolation joueurs : ✅/❌

#### Scénario 3 : Charge
- [ ] 100 entités : ✅/❌
- [ ] FPS client : [X] FPS
- [ ] Tick serveur : [X] Hz

#### Notes
[Observations, bugs trouvés, suggestions]

#### Verdict
[ ] ✅ Tous les tests passent - PRÊT POUR MERGE
[ ] ⚠️ Tests partiels - CORRECTIONS NÉCESSAIRES
[ ] ❌ Tests échoués - NE PAS MERGER
```

---

## 🎯 Prochains Tests à Ajouter

1. **Tests Unitaires Jest**
   - Tester World.js (création entités, composants)
   - Tester les systèmes individuellement

2. **Tests E2E Playwright**
   - Automatiser le scénario de placement de bâtiment
   - Tester la synchronisation multi-clients

3. **Tests de Charge Artillery**
   - Simuler 100 clients connectés
   - Mesurer la latence sous charge

4. **Tests de Sécurité**
   - Tenter d'envoyer des commandes invalides
   - Vérifier que le serveur rejette

---

**Bon courage avec les tests ! 🚀**
