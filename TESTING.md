# Guide de Test - SSV CORE v0.9.7

## Tests Rapides des Fonctionnalités

### 🎯 Test C1: Inventaire Multi-Blocs

**Objectif**: Vérifier que les 9 types de blocs sont sélectionnables et constructibles

1. **Ouvrir le jeu** et se connecter (ex: `node0`)
2. **Vérifier la hotbar** en bas de l'écran (9 slots colorés)
3. **Tester les touches 1-9**:
   - Appuyer sur `1` → Slot Pierre (gris) sélectionné
   - Appuyer sur `2` → Slot Terre (marron) sélectionné
   - Appuyer sur `3` → Slot Bois (beige) sélectionné
   - etc.
4. **Construire avec différents blocs**:
   - Sélectionner slot 4 (Herbe verte)
   - Clic gauche pour placer un bloc vert
   - Sélectionner slot 9 (Or doré)
   - Clic gauche pour placer un bloc doré
5. **Vérifier les couleurs** correspondent au type sélectionné

✅ **Succès si**: Hotbar visible, sélection change visuellement, blocs ont la bonne couleur

---

### 🌍 Test C2: Terrain Procédural

**Objectif**: Vérifier la génération automatique du terrain

1. **Ouvrir en navigation privée** (nouveau joueur)
2. **Se connecter** avec un nouveau nom (ex: `test_terrain`)
3. **Observer la console** (F12):
   - Message: `🌍 Génération du terrain procédural...`
   - Message: `✅ Terrain généré: XXXX blocs créés`
4. **Vérifier le terrain**:
   - Paysage 32×32 blocs visible
   - Hauteurs variables (collines/vallées)
   - Couleurs variées (herbe, sable, terre, pierre)
   - Neige sur les sommets
5. **Tester collision**: Se déplacer sur le terrain
6. **Tester destruction**: Clic droit pour miner

✅ **Succès si**: Terrain visible, ~2000-4000 blocs, biomes variés, collision fonctionne

---

### 🎮 Test A: Gameplay Complet

**Test A1: Destruction**
1. Clic gauche pour placer un bloc
2. Clic droit sur le bloc → il disparaît
3. Vérifier console: `🔨 Destruction: ent_XXXXX`

**Test A2: Collision**
1. Se déplacer vers un bloc
2. Le joueur s'arrête devant (pas de traversée)
3. Monter sur le bloc en sautant (si jump activé)

**Test A3: Chat**
1. Appuyer sur `Entrée` → input apparaît
2. Taper `Hello world` + Entrée
3. Message s'affiche avec timestamp et couleur
4. Ouvrir 2ème onglet, même username
5. Envoyer message → apparaît dans les 2 onglets

✅ **Succès si**: Destruction fonctionne, collision arrête joueur, chat synchronisé

---

### 🏗️ Test B: Architecture P2P

**Test B1: Horloge de Lamport**
1. Ouvrir console (F12)
2. Construire un bloc
3. Vérifier log: `[L123]` (numéro d'horloge logique)
4. Ouvrir 2ème onglet (autre joueur)
5. Construire → horloges synchronisées automatiquement

**Test B2: Quorum**
1. Mode solo: construire → immédiat (pas de quorum)
2. Ouvrir 2ème onglet (peer connecté)
3. Construire → attente 500ms pour validation
4. Vérifier console: `⏳ Quorum: ... - En attente...`
5. Puis: `✅ Quorum validé`

✅ **Succès si**: Logs Lamport visibles, quorum fonctionne en multi-joueur

---

### 🔄 Test Persistence

**Test localStorage**
1. Se connecter en tant que `player1`
2. Se déplacer, construire quelques blocs
3. Fermer l'onglet
4. Rouvrir, se reconnecter en tant que `player1`
5. Position et monde restaurés

**Test Backup Serveur** (optionnel)
1. Lancer `python3 server.py` dans un terminal
2. Construire des blocs
3. Attendre 60s (autosave serveur)
4. Vérifier `world-backup.json` créé
5. Relancer le jeu → monde restauré

✅ **Succès si**: Position sauvegardée, blocs persistants, backup serveur fonctionne

---

### 🚀 Test Multi-Joueur

**Scénario Complet**
1. **Onglet 1**: Connecté en tant que `alice`
2. **Onglet 2**: Connecté en tant que `bob`
3. **Vérifier découverte**: HUD montre "Pairs Actifs: 1"
4. **Alice** construit un bloc rouge (sélectionner slot 1)
5. **Bob** voit le bloc apparaître
6. **Bob** envoie un message chat
7. **Alice** reçoit le message
8. **Alice** détruit le bloc
9. **Bob** voit le bloc disparaître
10. **Vérifier quorum**: logs montrent validation par témoin

✅ **Succès si**: Tous les événements synchronisés en temps réel

---

## Checklist Finale

- [ ] Hotbar affichée avec 9 slots
- [ ] Sélection touches 1-9 fonctionne
- [ ] Blocs construits ont la bonne couleur
- [ ] Terrain procédural généré au premier spawn
- [ ] ~2000-4000 blocs de terrain visibles
- [ ] Biomes variés (herbe, sable, pierre, neige)
- [ ] Collision joueur/blocs empêche traversée
- [ ] Clic droit détruit les blocs
- [ ] Chat P2P fonctionne (Entrée pour activer)
- [ ] Messages avec timestamp et couleur joueur
- [ ] Horloge Lamport incrémentée ([L123] visible)
- [ ] Quorum validé en multi-joueur
- [ ] Persistence sauvegarde position
- [ ] Backup serveur crée world-backup.json
- [ ] Multi-joueur synchronisé en temps réel

---

## Bugs Connus / Limitations

### Normaux
- **Terrain généré une seule fois** par nouveau joueur
- **Pas de chunks**: tout le terrain en mémoire
- **Pas de jump**: désactivé (peut être ajouté)
- **Admin bypass quorum**: comportement attendu

### À Investiguer Si...
- Hotbar ne s'affiche pas → Vérifier console F12
- Terrain ne se génère pas → Vérifier que c'est un nouveau joueur
- Couleurs incorrectes → Vérifier BLOCK_TYPES définitions
- Collision ne fonctionne pas → Vérifier checkBlockCollision()

---

## Performance Attendue

- **FPS**: 60 (stable avec <5000 blocs)
- **Latence P2P**: <50ms en local
- **Temps génération terrain**: <100ms
- **Mémoire**: ~150MB par onglet
- **Taille localStorage**: ~500KB par joueur

---

*Test réussi = MVP complet fonctionnel ! 🎉*
