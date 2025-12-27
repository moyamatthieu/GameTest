<!--
Rapport d'Impact de Synchronisation
====================================
Version : 2.4.0 → 3.0.0

Principes modifiés :
  - Principe XII → reformulé comme "Perspective et Contrôle RTS Classique" (renommé et clarifié)
  - Principe II → ajout de clarifications sur la perspective RTS à chaque échelle
  - Principe VII → renforcé avec accent sur tests de pathfinding et IA d'unités
  - Principe X → reformulé pour clarifier le style visuel RTS top-down

Sections ajoutées :
  - Principe XIV (Architecture ECS pour RTS)
  - Principe XV (Contrôle d'Unités par Ordres)
  - Principe XVI (Système de Mouvement et Pathfinding)
  - Principe XVII (Construction et Production RTS)

Sections supprimées :
  - Aucune

Changements (MAJOR) :
  - ✅ Transformation complète du paradigme de jeu : de "jeu spatial avec éléments RTS" vers "RTS pur multi-échelle"
  - ✅ Élimination du contrôle direct de vaisseau (6DOF, pilotage)
  - ✅ Clarification : le joueur donne des ordres à des unités, pas de contrôle direct
  - ✅ Architecture ECS formalisée pour logique RTS
  - ✅ Système de pathfinding obligatoire (grille/navmesh), pas de physique newtonnienne
  - ✅ Vue top-down stricte à toutes les échelles (Galaxy, System, Planet)
  - ✅ Mécaniques de construction et production inspirées de StarCraft/Supreme Commander

Templates nécessitant des mises à jour :
  ✅ .specify/templates/spec-template.md (valider que les user stories reflètent le paradigme RTS)
  ✅ .specify/templates/plan-template.md (ajouter gates de validation RTS)
  ✅ .specify/templates/tasks-template.md (catégories de tâches RTS : pathfinding, AI, construction)
  ⚠️ Tous les specs existants dans /specs/ doivent être révisés pour conformité RTS

Follow-up TODOs :
  - Auditer tous les specs dans /specs/ pour vérifier conformité avec le nouveau paradigme RTS
  - Mettre à jour les tests pour refléter les mécaniques RTS (sélection, ordres, pathfinding)
  - Réviser src/core/ pour implémenter l'architecture ECS formelle
-->

# Constitution (MMORTS) - Constitution du Projet
**RTS Multi-Échelle avec Architecture Peer-to-Peer - Inspiré par Mankind (1998) & Supreme Commander**

## Métadonnées

**Version Constitution** : 3.0.0  
**Date de Ratification** : 2025-12-15  
**Dernière Modification** : 2025-12-26  
**Amendements** : 
- 2.0.0 : Ajout Principe XI (Mécaniques Gameplay Avancées)
- 2.1.0 : Ajout Principe XII (Perspective RTS)
- 2.2.0 : Renforcement contraintes de performance P2P
- 2.3.0 : Intégration du serveur de persistance de secours
- 2.4.0 : Clarification serveur non-autoritaire + correction Stack
- 3.0.0 : Transformation complète en RTS pur multi-échelle, ajout Principes XIV-XVII (Architecture ECS, Contrôle par Ordres, Pathfinding, Construction)

---

## Vision du Projet

Ce jeu est un **RTS (Real-Time Strategy) multi-échelle** où le joueur commande des flottes, gère des bases, et développe un empire galactique. Il ne s'agit **PAS** d'un jeu de pilotage direct ou d'un simulateur spatial.

**Paradigme central** : Le joueur donne des **ordres** à des unités (déplacement, attaque, extraction, construction) comme dans StarCraft, Supreme Commander ou Total Annihilation. Les unités exécutent ces ordres de manière autonome avec une IA de pathfinding.

**Multi-échelle** : Le gameplay se déroule à trois niveaux (Galaxy, System, Planet), chacun avec une vue RTS top-down tactique. Le joueur zoom entre les échelles pour gérer son empire à différents niveaux stratégiques.

**Architecture P2P décentralisée** : Validation distribuée, pas de serveur autoritaire, mais avec persistance de secours pour assurer la continuité.

---

## Principes Fondamentaux

### I. Architecture Peer-to-Peer avec Autorité Distribuée
**Le monde du jeu utilise une architecture P2P décentralisée avec validation distribuée pour garantir l'intégrité.**

- Réseau P2P avec WebRTC : Connexions directes entre joueurs via PeerJS
- Découverte de Pairs : PeerJS pour obtenir les adresses des nœuds et établir connexions
- Système d'Autorité Distribuée : Validation des actions par consensus entre pairs de confiance
- Validateurs Rotatifs : Pairs avec haute réputation élus temporairement comme validateurs
- Persistance Distribuée : État du jeu répliqué sur plusieurs nœuds (redondance)
- Consensus par Majorité : Actions critiques nécessitent validation de 51%+ des validateurs connectés
- Simulation Locale avec Synchronisation : Chaque client simule son état, synchronise avec les validateurs

**Justification** : L'architecture P2P élimine les coûts serveur, mais nécessite un mécanisme d'autorité pour éviter la triche. La validation distribuée par pairs de confiance crée une "preuve sociale" où la majorité honnête contrôle l'intégrité. PeerJS simplifie la découverte et connexion des pairs.

### II. Structure Spatiale Hiérarchique (Le Lattice)
**L'univers du jeu suit une organisation hiérarchique stricte : Galaxie → Clusters → Systèmes → Planètes, avec une vue RTS top-down à chaque échelle.**

- **Grille Galactique** : Exactement 10×10 clusters (100 zones au total).
  - **Vue RTS Galaxy** : Caméra top-down montrant la grille de clusters. Les unités inter-cluster (flottes galactiques) sont représentées comme des icônes/sprites 2D se déplaçant sur cette grille.
  - Chaque cluster contient exactement 10 systèmes stellaires (étoiles).
  - **Centres de Cluster** : 1 à 2 étoiles par cluster sont désignées comme "centres", avec une densité de population et de ressources de base plus élevée.
  - **Routes Galactiques** : Des routes spatiales permanentes relient les étoiles "centres" des clusters adjacents (Nord, Sud, Est, Ouest), créant un réseau dorsal (backbone) à travers toute la galaxie.
  - **Aucune construction** n'est possible en vue Galactique. Le joueur donne des ordres de déplacement de flottes entre systèmes.
- **Systèmes Stellaires** : Un soleil central avec des planètes orbitant autour.
  - **Vue RTS System** : Caméra top-down montrant le système solaire comme un plan 2D (orbites plates). Les planètes sont des cercles/sphères vus du dessus.
  - **Grille de Construction Spatiale** : Chaque planète possède une grille plate centrée sur elle, d'environ 2 fois son diamètre.
  - La construction dans l'espace (stations orbitales, chantiers navals) est limitée exclusivement à cette grille plate.
  - Le joueur sélectionne des emplacements de construction via box-selection RTS standard.
- **Planètes Procédurales** : 1 à 10 planètes par étoile, générées de manière déterministe.
  - **Vue RTS Planet** : Caméra top-down orthographique montrant la surface de la planète projetée en 2D (carte "déroulée" ou projection isométrique).
  - **Surface Sphérique** : La construction sur planète se fait directement sur la surface de la sphère, mais visualisée en 2D top-down pour lisibilité RTS.
  - **Relief et Biomes** : La surface n'est pas une sphère parfaite ; elle utilise des **Heightmaps multi-couches** (bruit de Perlin) pour générer du relief (élévation) et définir les biomes.
  - **Distribution des Ressources** : Des couches de heightmaps spécifiques déterminent la répartition des 10 types de ressources, permettant des corrélations entre le terrain et les richesses (ex: Uranium dans les montagnes).
  - Le joueur sélectionne des unités et donne des ordres de déplacement/construction/extraction sur cette carte 2D.

**Justification** : L'organisation hiérarchique fournit des couches de gameplay naturelles. La vue RTS top-down à **chaque échelle** garantit une lisibilité tactique maximale et des contrôles cohérents. La distinction entre construction sphérique (planète) et plate (espace) simplifie le gameplay tout en offrant une immersion visuelle forte. Les routes galactiques structurent l'expansion à grande échelle. L'approche multi-couches pour les heightmaps permet une génération de monde riche et cohérente.

### III. Économie de Ressources Physiques
**Les ressources sont des entités tangibles qui doivent être transportées physiquement dans l'espace.**

- **Dix Ressources de Base** : Fer, Cuivre, Eau, Hélium-3, Silicium, Uranium, Titane, Terres Rares, Hydrogène, Carbone.
- **Distribution par Heightmaps (Bruit de Perlin)** :
  - L'abondance des ressources, la répartition des biomes et la densité des planètes sont gérées par des cartes de bruit (Heightmaps) superposées.
  - **Logique de Rareté** : Les étoiles "centres" de cluster sont riches en ressources de bas niveau (Fer, Cuivre, Eau) mais pauvres en ressources rares. Plus on s'éloigne du centre, plus les ressources de base se raréfient au profit de ressources de haut niveau (Uranium, Terres Rares).
- **Logistique Physique** : Les cargos transportent physiquement les marchandises le long de routes définies.
- **Mécaniques d'Interception** : Les cargos peuvent être piratés ou détruits en transit.
- **Marché Dynamique** : Bourse galactique pilotée par les joueurs avec fluctuations de prix en temps réel.

**Justification** : Le mouvement physique des ressources crée du gameplay émergent. La distribution par heightmaps et la logique centre/périphérie créent un équilibre stratégique : les centres sont des hubs logistiques sûrs, tandis que la périphérie offre des ressources précieuses mais plus difficiles à exploiter.

### IV. Progression Technologique Modulaire
**La technologie progresse par recherche non-linéaire, débloquant des composants modulaires plutôt que des types d'unités fixes.**

- Centres de Recherche : Bâtiments qui génèrent des points de technologie
- Arbre Technologique Non-Linéaire : Multiples chemins de recherche avec prérequis
- Conception Modulaire de Vaisseaux : Châssis + Propulsion + Armes + modules de Cargo
- Déblocages Technologiques : Nouveaux matériaux, types de bâtiments et conceptions de composants
- Épuisement des Ressources Planétaires : La surexploitation dégrade les planètes, forçant l'expansion

**Justification** : La progression modulaire permet la créativité des joueurs et la diversité stratégique. Les joueurs peuvent se spécialiser dans l'efficacité du cargo, la puissance de combat ou des conceptions équilibrées selon leur style de jeu.

### V. Gouvernance Galactique Pilotée par les Joueurs
**Les joueurs influents et les alliances peuvent proposer et voter des lois applicables à un secteur (le système "Constitution").**

- Lois de Secteur : Règles applicables à des clusters ou systèmes spécifiques
- Pouvoir de Vote : Basé sur l'influence du joueur, le territoire ou l'appartenance à une alliance
- Types de Lois :
  - Taxes Commerciales : Tarifs sur des ressources spécifiques dans des zones désignées
  - Restrictions de Combat : Systèmes sanctuaires où le combat est interdit
  - Droits sur les Ressources : Quotas miniers ou permissions d'extraction exclusives
- Règles Dynamiques : Les lois peuvent être amendées ou abrogées par votes ultérieurs

**Justification** : La gouvernance par les joueurs crée une profondeur politique, une diplomatie émergente, et donne un sens thématique au nom "Constitution". Cela ajoute une couche de méta-stratégie au-delà de la simple compétition militaire/économique.

### VI. Brouillard de Guerre Historique
**Les joueurs voient le dernier état connu des zones explorées, pas des mises à jour en temps réel.**

- Persistance de l'Exploration : Une fois explorées, les zones restent visibles avec les dernières données connues
- Marqueurs Temporels : L'interface indique l'âge des données ("Dernière analyse : il y a 2 jours")
- Exigences de Reconnaissance : Vaisseaux de reconnaissance nécessaires pour les mises à jour de renseignement
- Narration Émergente : Les joueurs découvrent les conséquences de batailles ou des bases abandonnées

**Justification** : Crée du gameplay de renseignement et des mécaniques de surprise. Les joueurs doivent investir dans l'espionnage et peuvent exploiter la désinformation ou les tactiques de tromperie.

### VII. Développement Test-First (NON-NÉGOCIABLE)
**Tous les systèmes de jeu doivent être validés par des tests automatisés avant l'implémentation.**

- TDD Obligatoire : Écrire les tests → Obtenir l'approbation → Voir les tests échouer → Implémenter la fonctionnalité
- Exigences de Couverture de Tests :
  - Tests unitaires : Logique de jeu partagée (calculs de ressources, résolution de combat, **pathfinding**, **IA d'unités**)
  - Tests d'intégration : Synchronisation P2P via PeerJS, mécanismes de consensus, **commandes d'unités distribuées**
  - Tests E2E : Flux utilisateur critiques (connexion PeerJS, **sélection d'unités**, **ordres de déplacement/attaque**, **construction de bâtiments**, commerce)
  - Tests de Réseau : Latence, déconnexions, réconciliation d'état, **synchronisation de positions d'unités**
  - Tests RTS : **Box selection**, **ordres contextuels (clic droit)**, **files d'attente de construction**, **groupes de contrôle**
- Red-Green-Refactor : Adhésion stricte au cycle TDD

**Justification** : Dans une architecture P2P avec mécaniques RTS complexes, les bugs de synchronisation ou d'IA peuvent créer des états divergents catastrophiques. Les tests garantissent la cohérence du réseau distribué, la fiabilité du pathfinding, et la prévisibilité du comportement des unités malgré la latence et les déconnexions.

### VIII. Système de Notifications en Temps Réel
**Les joueurs doivent être informés immédiatement des événements critiques affectant leurs actifs, même hors-ligne.**

- Notifications Push : Alertes instantanées pour attaques, commerce critique, votes de lois
- Canaux Multiples : In-game, email, et notifications navigateur/mobile
- Filtrage Personnalisable : Joueurs configurent quels événements déclenchent des notifications
- Priorités d'Événements :
  - Critique : Attaques sur bases principales, votes de lois affectant le joueur
  - Important : Commerce de grande valeur, arrivée de flottes, recherches complétées
  - Informatif : Production terminée, messages d'alliance

**Justification** : Inspiré de Mankind qui utilisait SMS, les notifications modernes gardent les joueurs engagés et permettent de réagir aux menaces même hors-ligne. Essentiel pour un jeu persistant où les événements continuent 24/7.

### IX. Environnements Actifs et Chargement Contextuel
**Pour optimiser les performances, un seul environnement (galaxie/système/planète) est chargé activement par joueur.**

- Trois Niveaux de Vue :
  - **Vue Galaxie** : Affiche les clusters et les routes entre étoiles.
  - **Vue Système** : Affiche le soleil et les planètes en orbite.
  - **Vue Planète** : Affiche la surface de la planète avec son relief et ses bâtiments.
- Chargement à la Demande : Seul l'environnement actuellement visualisé est entièrement chargé côté client.
- Simulation Distribuée : Les validateurs simulent les environnements, le client n'affiche qu'une zone.
- Transitions Fluides : Changement d'environnement avec préchargement.
- Cartes Planétaires Wraparound : Les planètes sont sans bordures (sortir à l'est = entrer à l'ouest).
- Restrictions Contextuelles : Certaines unités limitées à certains environnements (vaisseaux terrestres sur planètes uniquement).

**Justification** : Approche de Mankind modernisée. Permet une scalabilité massive tout en maintenant des performances fluides. La séparation nette des vues permet de focaliser l'attention du joueur sur l'échelle appropriée.

### X. Rendu 3D par Primitives Géométriques (Vue RTS Top-Down)
**Tous les objets 3D du jeu sont construits à partir de primitives géométriques Three.js, visualisés depuis une perspective RTS tactique.**

- Primitives de Base : BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry.
- **Terrain Procédural** : Utilisation de `PlaneGeometry` ou `SphereGeometry` déformées par des Heightmaps (bruit de Perlin) pour le relief planétaire.
- **Caméra RTS** : Toujours positionnée au-dessus de la scène (top-down), angle fixe ou légèrement incliné (60-90°). **PAS de caméra libre, PAS de vue cockpit**.
- Style Visuel : Esthétique géométrique minimaliste inspirée de RTS classiques, pas de modèles 3D externes complexes.
- **Lisibilité Tactique** : Les unités et bâtiments doivent être immédiatement reconnaissables depuis la vue aérienne. Couleurs d'équipe, outlines, et icônes 2D superposées si nécessaire.
- Performance : Géométries simples = rendu optimisé, idéal pour des milliers d'objets simultanés (flottes massives).
- Matériaux : MeshStandardMaterial, MeshPhongMaterial avec couleurs et effets de lumière.
- Construction Procédurale : Vaisseaux et bâtiments assemblés par combinaison de primitives.
- Hiérarchie Three.js : Object3D pour groupement et transformations.

**Justification** : Les primitives géométriques sont légères, rapides à rendre, et permettent un style visuel distinctif. La vue top-down stricte garantit la lisibilité tactique essentielle à un RTS. L'utilisation de heightmaps pour le relief ajoute de la profondeur visuelle sans sacrifier la performance.

### XI. Mécaniques de Gameplay Avancées
**Le jeu propose des systèmes de gameplay riches et interconnectés pour profondeur stratégique et émergence.**

#### 1. Événements Galactiques Dynamiques
- Événements Aléatoires : Tempêtes stellaires, pluies de météorites, anomalies quantiques, invasions aliens
- Occurrence par Consensus : Validateurs votent sur déclenchement d'événements (anti-manipulation)
- Effets Zone : Impact sur clusters entiers (ralentissement voyages, bonus ressources, portails temporaires)
- Comètes Messagères : Apportent technologies anciennes ou blueprints rares
- Menaces Communes : Invasions aliens NPC forçant coopération temporaire entre joueurs

#### 2. Système d'Espionnage et Sabotage
- Sondes Invisibles : Révèlent mouvements ennemis, durée limitée avant détection
- Agents Infiltrés : Sabotage de production, vol de recherches, corruption de données
- Vol Technologique : Copier blueprints adverses (coût élevé, risque de détection)
- Désinformation : Corrompre brouillard de guerre ennemi avec fausses données
- Cyber-Attaques : Tentatives de déconnexion de validateurs ennemis (très risqué)

#### 3. Artefacts Anciens et Archéologie
- Ruines Procédurales : Génération aléatoire sur planètes explorées
- Expéditions : Prennent temps réel (heures/jours), peuvent échouer
- Artefacts Uniques : Bonus permanents (vitesse +10%, production +15%, armes +20%)
- Collections : Sets d'artefacts donnent bonus supplémentaires
- Enchères P2P : Ventes d'artefacts rares entre joueurs, réputation requise

#### 4. Catastrophes et Gestion de Crise
- Épidémies Planétaires : -50% population temporaire, nécessite quarantaine
- Révoltes de Colonies : Bases deviennent neutres, doivent être reconquises
- Accidents Industriels : Pollution durable, -production permanente sans cleanup
- Pénuries Critiques : Inflation soudaine sur marché, course aux ressources
- Mutineries : Flottes changent de camp si moral trop bas

#### 5. Système de Contrats et Mercenaires
- Tableau de Contrats : Missions générées procéduralement ou par joueurs
- Types : Transport, escorte, assassinat, reconnaissance, terraformation, construction
- Récompenses : Crédits, ressources, réputation, blueprints
- Échecs : Pénalités de réputation, amendes
- Classement Mercenaires : Top performers reçoivent contrats premium

#### 6. Terraformation Progressive
- 5 Étapes : Hostile → Aride → Habitable → Fertile → Paradis
- Progression : Semaines/mois réels, investissement ressources continu
- Bonus Cumulatifs : Chaque étape +20% production, +capacité population
- Vulnérabilité : Peut être sabotée par ennemis (terrorisme écologique)
- Valeur Stratégique : Planètes terraformées valent plus en conquête/commerce

#### 7. Factions Internes et Politique
- Trois Factions : Militaire (combat), Scientifique (recherche), Commercial (économie)
- Satisfaction : Choix de gameplay influencent réputation de faction
- Malus Mécontentement : -production/-recherche/-commerce si faction <30%
- Bonus Satisfaction : Capacités uniques si faction >80%
- Coup d'État : Si faction <10% pendant 7 jours, perte temporaire contrôle

#### 8. Contrebande et Marché Noir
- Ressources Interdites : Armes lourdes, substances illégales, données volées
- Prix Premium : +50% prix marché normal mais risque détection
- Routes Secrètes : Évitent taxes de lois Constitution, mais vulnérables
- Réputation Hors-La-Loi : Track parallèle, accès contenu spécial
- Alliances Pirates : Protection moyennant tribut régulier

#### 9. Héros et Personnages Uniques
- Types : Généraux (+15% combat), Scientifiques (+25% recherche), Diplomates (+influence votes)
- Recrutement : Aléatoire (rareté élevée) ou formation longue (6 mois réels)
- Mortalité : Peuvent mourir en mission, perte permanente
- Progression : Niveau 1-10, débloquent capacités spéciales
- Marché P2P : Vente/achat héros via enchères, validation consensus

#### 10. Guerres Totales avec Enjeux
- Déclaration Formelle : Période minimum 7 jours, vote requis si alliance
- Objectifs Mesurables : Conquête territoire, capture ressources, humiliation publique
- Score Temps Réel : Visible par tous, crée tension dramatique
- Négociations : Cessez-le-feu, traités de paix, indemnités de guerre
- Smart Contracts : Traités contraignants validés par consensus P2P, violations = sanctions automatiques

**Justification** : Ces mécaniques créent profondeur stratégique, émergence narrative, et diversité de gameplay. Elles supportent différents styles de jeu (militaire, économique, diplomatique, explorateur) tout en maintenant équilibre via validation P2P et consensus distribué.

### XII. Perspective et Contrôle RTS Classique (NON-NÉGOCIABLE)
**L'expérience utilisateur est strictement ancrée dans les standards du RTS classique avec une vue de dessus obligatoire.**

- **Vue Top-Down Stricte** : Caméra orientée vers le bas (angle 60-90°), **JAMAIS de vue à la première personne ou de cockpit**.
- **Contrôles RTS Standards** :
  - **Clic gauche** : Sélection d'unités individuelles
  - **Clic gauche + glisser** : Box selection (rectangle de sélection pour groupes d'unités)
  - **Clic droit** : Ordre contextuel automatique (déplacement, attaque, extraction, réparation selon la cible)
  - **Shift + clic droit** : File d'attente d'ordres (waypoints)
  - **Touches numériques (1-0)** : Groupes de contrôle (sauvegarde et rappel de sélections)
- **Navigation Multi-Échelle** :
  - Interface de sélection de vue (Boutons : **Galaxy**, **System**, **Planet**).
  - Zoom contextuel permettant de passer d'une vue à l'autre : zoom fluide (smooth zoom) pour le défilement manuel, et transition par zoom rapide (fast zoom) lors de l'utilisation des boutons de l'interface.
  - **Double-clic** sur une planète/système dans la minimap = transition rapide vers cette échelle.
- **Caméra RTS** :
  - Déplacement par bords d'écran (edge scrolling) ou touches **WASD/Flèches**.
  - Zoom molette de souris (limité pour maintenir la lisibilité).
  - **PAS de rotation libre de la caméra** : angle fixe pour préserver la cohérence tactique.
- **Lisibilité Maximale** : Les unités et bâtiments doivent être identifiables instantanément depuis la vue aérienne.
  - Couleurs d'équipe (bleu = allié, rouge = ennemi, jaune = neutre).
  - Outlines et selection rings autour des unités sélectionnées.
  - Barres de vie/boucliers au-dessus des unités.
- **Interface de Gestion** : HUD clair superposé à la vue tactique, minimap indispensable montrant:
  - Fog of war (zones explorées vs inexplorées).
  - Unités alliées/ennemies (points colorés).
  - Alertes (attaques, construction terminée).

**Justification** : La vue top-down stricte est une contrainte fondamentale pour garantir la lisibilité tactique et l'expérience RTS authentique. Les contrôles standards (box selection, clic droit contextuel, groupes de contrôle) sont des conventions établies depuis StarCraft et Total Annihilation. La navigation multi-échelle est le cœur de l'exploration et de la gestion de l'empire galactique. **Toute déviation vers le pilotage direct ou la vue subjective violerait le paradigme RTS et sera rejetée.**

### XIII. Serveur de Persistance et Hébergement (Non-autoritaire)
**Un petit serveur HTTP existe uniquement pour servir l'application et fournir un filet de sécurité de persistance si le réseau P2P perd tous ses nœuds.**

- Hébergement : Sert les fichiers statiques (build Vite) au navigateur
- Persistance "filet de sécurité" : Stocke des snapshots et/ou un journal append-only des mutations SIGNÉES
- Non-autoritaire : Le serveur ne valide pas la simulation et ne décide pas de l'état final; il stocke et restitue
- Vérification minimale : Refuse tout write non signé, vérifie formats/tailles/horodatage, rate-limit
- Restauration : En cas d'extinction totale du réseau P2P, les clients repartent du dernier snapshot stocké
- Optionnel mais recommandé : Peut aussi héberger le signaling PeerJS (self-host) si besoin de contrôle opérationnel

**Justification** : L'architecture P2P est économique et robuste, mais elle peut perdre l'historique si tous les nœuds disparaissent. Un serveur minimal assure la continuité (persistance + distribution des fichiers) sans réintroduire un serveur autoritaire coûteux.

### XIV. Architecture ECS pour RTS (NON-NÉGOCIABLE)
**La logique de jeu utilise une architecture Entity-Component-System (ECS) stricte pour gérer les unités, bâtiments, et systèmes de gameplay.**

- **Entités** : Objets de jeu identifiés par un ID unique (vaisseaux, bâtiments, planètes, ressources).
- **Composants** : Données pures sans logique (Position, Health, Velocity, Owner, Cargo, WeaponStats, BuildQueue).
- **Systèmes** : Logique pure opérant sur des ensembles de composants (MovementSystem, CombatSystem, ProductionSystem, PathfindingSystem).
- Séparation Stricte :
  - **ECS (src/ecs/)** : Logique de jeu, état du monde, simulation.
  - **Renderer (src/renderer/)** : Affichage Three.js, lecture seule de l'état ECS.
  - **Input (src/ui/input/)** : Capture des commandes utilisateur, génération d'événements pour l'ECS.
- **Tick-based Simulation** : Le monde ECS progresse par ticks discrets (1 tick/seconde), pas de delta-time continu.
- **Déterminisme** : Même séquence d'inputs + même état initial = même état final (essentiel pour validation P2P).
- **Serialization** : L'état ECS doit être sérialisable en JSON pour synchronisation P2P et persistance.

**Justification** : L'architecture ECS garantit la séparation des préoccupations, la testabilité, et le déterminisme requis pour une simulation distribuée P2P. Elle facilite l'ajout de nouvelles mécaniques (nouveaux composants/systèmes) sans refactoring massif. Le tick-based simulation assure la synchronisation précise entre pairs.

### XV. Contrôle d'Unités par Ordres (NON-NÉGOCIABLE)
**Les unités sont contrôlées par des ordres donnés par le joueur, PAS par un contrôle direct (clavier/souris).**

- **Paradigme de Commande** : Le joueur émet des **ordres** (Move, Attack, Patrol, Hold Position, Extract Resource, Build Structure, Repair).
- **Exécution Autonome** : Les unités exécutent les ordres via une IA locale (pathfinding, évitement de collision, engagement auto si attaque).
- **File d'Attente d'Ordres** : Shift+clic permet d'ajouter des ordres en séquence (waypoints, constructions multiples).
- **Ordres Contextuels (Clic Droit)** :
  - Clic droit sur terrain vide = **Move** (déplacement).
  - Clic droit sur ennemi = **Attack** (attaque).
  - Clic droit sur ressource = **Extract** (extraction).
  - Clic droit sur bâtiment allié endommagé = **Repair** (réparation).
  - Clic droit sur unité alliée = **Follow** (escorte).
- **Groupes de Contrôle** : Touches 1-0 pour sauvegarder et rappeler des sélections d'unités. Double-appui sur une touche = centrer caméra sur ce groupe.
- **Formation et Mouvement de Groupe** : Les unités sélectionnées en groupe se déplacent en formation (ligne, colonne, carré) avec évitement de collision.
- **Annulation d'Ordres** : Stop (S) annule tous les ordres en cours, Hold Position (H) force l'immobilité.

**Justification** : Le contrôle par ordres est la pierre angulaire du RTS. Il permet la gestion de dizaines/centaines d'unités simultanées, impossible avec un contrôle direct. L'IA d'exécution des ordres (pathfinding, combat auto) libère le joueur pour se concentrer sur la stratégie macro. Les ordres contextuels réduisent la friction interface.

### XVI. Système de Mouvement et Pathfinding (NON-NÉGOCIABLE)
**Le mouvement des unités repose sur un pathfinding intelligent sur grille/navmesh, PAS sur de la physique newtonnienne ou du pilotage 6DOF.**

- **Grilles de Navigation** :
  - **Galaxy** : Graphe de systèmes reliés par des routes galactiques.
  - **System** : Grille 2D plate autour de chaque planète (espace orbital).
  - **Planet** : Grille 2D projetée sur la surface sphérique (heightmap-aware).
- **Algorithme de Pathfinding** : A* ou JPS (Jump Point Search) pour trouver le chemin le plus court en évitant obstacles.
- **Évitement de Collision** : Flow fields ou steering behaviors pour éviter les collisions entre unités en mouvement.
- **Coût de Terrain** : Les heightmaps influencent le coût de mouvement (montagnes = lent, plaines = rapide).
- **Zones Bloquées** : Bâtiments, ressources, et terrain impassable créent des obstacles dans la grille.
- **Navigation Multi-Échelle** : Les unités inter-système (flottes galactiques) suivent les routes entre systèmes. Les unités intra-système se déplacent sur la grille orbitale. Les unités planétaires suivent la grille de surface.
- **PAS de Physique Spatiale** : Pas d'inertie, pas de propulsion vectorielle, pas de contrôle à 6 degrés de liberté. Le mouvement est simplifié pour clarté RTS.
- **Vitesse Discrète** : Les unités ont une vitesse en cases/tick (ex: 5 cases/tick = unité rapide).

**Justification** : Le pathfinding sur grille/navmesh est la méthode standard des RTS depuis StarCraft. Il garantit un mouvement prévisible et contrôlable, essentiel pour la micro-gestion tactique. La physique spatiale réaliste (6DOF, inertie) serait incompatible avec le paradigme RTS et rendrait le contrôle de grandes flottes impossible.

### XVII. Construction et Production RTS (NON-NÉGOCIABLE)
**Le système de construction et production suit les conventions des RTS classiques : bâtiments produisent des unités via files d'attente.**

- **Placement de Bâtiments** :
  - Le joueur sélectionne un type de bâtiment dans le menu de construction.
  - Le curseur se transforme en "mode placement" (preview fantôme du bâtiment).
  - Clic gauche sur un emplacement valide = ordre de construction émis.
  - Un ouvrier/constructeur se déplace vers l'emplacement et construit progressivement (barre de progression).
- **Coût de Construction** : Chaque bâtiment coûte des ressources (Fer, Cuivre, etc.) déduites immédiatement lors de l'ordre.
- **Files de Production** : Les bâtiments militaires (usines, chantiers navals) produisent des unités une par une.
  - Clic sur icône d'unité = ajout à la file de production (coût déduit).
  - Shift+clic = ajouter 5 unités à la file.
  - Barre de progression visible sur le bâtiment.
  - Les unités apparaissent au point de ralliement (rally point) défini par le joueur.
- **Ordres de Construction Multiples** : Shift+clic permet de placer plusieurs bâtiments d'un coup (le constructeur les construira en séquence).
- **Dépendances Technologiques** : Certains bâtiments/unités nécessitent des technologies débloquées (arbre tech).
- **Efficacité de Production** : Plusieurs usines produisent en parallèle (ex: 3 usines = 3 unités simultanées).
- **Réparation** : Les unités/bâtiments endommagés peuvent être réparés par des ouvriers (coût ressources réduit).

**Justification** : Le système de construction/production est le cœur économique d'un RTS. Les files de production permettent au joueur de planifier la montée en puissance militaire. Le placement manuel de bâtiments crée des décisions stratégiques (défense, proximité ressources). L'approche "preview fantôme + clic pour confirmer" est standard depuis Warcraft II et garantit une UX claire.

## Contraintes d'Architecture

### Stack Technologique
- **Langage** : TypeScript (obligatoire pour tout le code)
- **Architecture** : ECS (Entity-Component-System) pour la logique de jeu
- **Rendu 3D** : Three.js avec primitives géométriques uniquement
- **Caméra** : Top-down fixe (RTS style), pas de free-look
- **Build** : Vite pour bundling et développement
- **Réseau P2P** : PeerJS (WebRTC avec signaling intégré)
- **Pathfinding** : Implémentation A* ou JPS custom, ou bibliothèque légère (pathfinding.js, easystarjs)
- **ECS Library** : Implementation custom lightweight ou bibliothèque minimaliste (bitecs, ecsy)
- **Stockage Local** : LocalStorage/IndexedDB (cache client) + synchronisation P2P via validateurs
- **Serveur (Non-autoritaire)** : HTTP statique + API de persistance (snapshots/journal signé) pour restauration
- **Authentification** : Décentralisée avec paires de clés cryptographiques (Ed25519)
- **Consensus** : Bibliothèque de validation distribuée (inspirée de Raft simplifié)
- **Notifications** : Navigateur natif (Notification API)
- **Déploiement** : Application web statique (Vite build) + PeerJS cloud ou self-hosted

### Standards de Performance
- Grille Galactique : Doit supporter 100 clusters × 10 systèmes × 5 planètes en moyenne = 5 000 planètes
- Connexions P2P Simultanées : Chaque client maintient 10-50 connexions WebRTC actives (pairs proches)
- Rendu Three.js : Minimum 30 FPS avec 1000+ objets primitifs visibles
- **ECS Performance** : Support de 5000+ entités actives simultanément avec 60 ticks/minute (1 tick/seconde)
- **Pathfinding** : Calcul de chemin pour 100+ unités en <50ms (A* sur grille 1000×1000)
- **Sélection d'Unités** : Box selection de 500+ unités en <16ms (60 FPS)
- Latence P2P : Synchronisation d'état en moins de 200ms entre pairs directs via PeerJS
- Simulation Locale : Tick rate de 1 seconde pour calculs locaux (production, mouvement, combat)
- Chargement d'Environnement : Transition entre environnements en moins de 2 secondes
- Réconciliation d'État : Maximum 5 secondes pour résoudre conflits entre pairs
- Bande Passante : Maximum 100 KB/s upload/download par joueur en pic
- Chargement d'Environnement : Transition entre environnements en moins de 2 secondes
- Réconciliation d'État : Maximum 5 secondes pour résoudre conflits entre pairs
- Bande Passante : Maximum 100 KB/s upload/download par joueur en pic

### Scalabilité Massive (Inspiré de Mankind - Adapté P2P)
- Architecture évolutive vers des dizaines de milliers de systèmes stellaires
- Partitionnement par cluster galactique : Chaque cluster = réseau P2P distinct
- Nœuds Coordonnateurs : Un joueur élu par cluster (rotations régulières)
- Système de "fermeture" de zones : Clusters inactifs sauvegardés, réactivés à la demande
- Plan de croissance : Débuter avec 100 clusters, expansion organique par la communauté
- Topologie de Réseau : Mesh partiel - chaque nœud connecté à ses voisins logiques (même cluster/système)

### Exigences de Sécurité (Architecture P2P avec Autorité Distribuée)
- Identité Cryptographique : Paires de clés publique/privée Ed25519 (clé publique = ID joueur)
- Signature de Toutes Actions : Chaque mutation signée cryptographiquement par l'auteur
- Système de Validateurs : 
  - Validateurs = Pairs avec score de réputation > 80/100
  - Rotation toutes les 30 minutes pour éviter collusion
  - Minimum 5 validateurs par cluster, maximum 15
- Consensus Anti-Triche : 
  - Actions locales (mouvement UI) : Instantanées, vérifiées a posteriori
  - Actions moyennes (commerce, construction) : Validation par 3 validateurs minimum
  - Actions critiques (combat, transfert massif) : Validation par 51% des validateurs
- Détection de Triche : 
  - Validateurs vérifient cohérence (ressources, positions, timestamps)
  - Détection = score de réputation -20 points
  - Score < 20 = Isolement du réseau (ban distribué)
- Communication Chiffrée : WebRTC avec DTLS-SRTP (chiffrement natif)
- Réputation Distribuée : 
  - Score initial : 50/100 (neutre)
  - +1 point par heure de jeu honnête validé
  - +5 points pour devenir validateur sans incident
  - -20 points par détection de triche confirmée
  - Score propagé via gossip protocol entre pairs

## Workflow de Développement

### Processus de Développement de Fonctionnalités
1. **Spécification** : Utiliser `speckit.specify` pour créer des spécifications détaillées
2. **Clarification** : Lancer `speckit.clarify` pour résoudre les ambiguïtés
3. **Planification** : Générer la conception avec `speckit.plan`
4. **Génération de Tâches** : Créer des tâches ordonnées avec `speckit.tasks`
5. **Implémentation** : Exécuter avec `speckit.implement` ou codage manuel
6. **Tests** : Les tests E2E doivent passer avant la finalisation de la fonctionnalité
7. **Revue** : La revue de code se concentre sur la conformité à la Constitution

### Portes de Qualité
- Aucune fusion de fonctionnalité sans tests automatisés réussis
- Les benchmarks de performance doivent atteindre les cibles (voir Standards de Performance)
- Revue de sécurité requise pour les mécanismes de consensus et cryptographie
- Code TypeScript avec typage strict obligatoire (strictNullChecks: true)

### Checklist de Revue de Code
- [ ] Suit les principes de structure spatiale hiérarchique
- [ ] Code TypeScript avec typage strict (no implicit any)
- [ ] Mouvement physique des ressources (pas de téléportation)
- [ ] Signatures cryptographiques pour actions sensibles
- [ ] Mécanisme de consensus P2P pour validation distribuée
- [ ] Objets 3D construits uniquement avec primitives Three.js
- [ ] Synchronisation PeerJS efficace (minimise bande passante)
- [ ] Gestion des déconnexions et reconnexions gracieuse
- [ ] Système de notifications implémenté pour événements critiques
- [ ] Chargement contextuel optimisé (un environnement actif par joueur)
- [ ] Tests écrits et réussis (incluant tests réseau PeerJS)
- [ ] Impact sur les performances évalué (FPS + latence réseau)

## Clarifications

### Session 2025-12-26
- Q: Comment gérer la transition entre les échelles (Galaxie, Système, Planète) ? → A: Utilisation d'un zoom fluide pour le manuel et d'un zoom rapide automatisé pour les boutons UI.
- Q: Comment sont réparties les ressources et les routes dans la galaxie ? → A: 1-2 étoiles "centres" par cluster reliées par des routes entre clusters adjacents. Ressources de base au centre, ressources rares en périphérie, le tout piloté par des Heightmaps (bruit de Perlin).
- Q: Comment implémenter les Heightmaps pour les planètes ? → A: Utilisation de Heightmaps multi-couches (relief, biomes, ressources) pour permettre des corrélations entre terrain et ressources.

## Gouvernance

### Processus d'Amendement
1. Changements proposés documentés avec justification
2. Évaluation d'impact sur les fonctionnalités existantes
3. Vote de l'équipe de développement principale (majorité requise)
4. Incrémentation de version suivant le versionnement sémantique
5. Mise à jour des templates dépendants et de la documentation

### Contrôle de Version
- **MAJEUR** : Changements cassants aux principes fondamentaux (ex : suppression de la persistance)
- **MINEUR** : Ajout de nouveaux principes ou expansions significatives
- **PATCH** : Clarifications, corrections de fautes, raffinements non-sémantiques

### Conformité
Cette Constitution supplante toutes les autres pratiques de développement. Toutes les spécifications de fonctionnalités, plans et implémentations doivent s'aligner sur ces principes. Les déviations nécessitent une justification explicite et un amendement constitutionnel.

---

## Inspirations de Mankind (1998)

Cette constitution s'inspire du jeu MMORTS pionnier **Mankind** développé par Vibes Online Gaming :

**Éléments conservés et modernisés :**
- ✅ Univers persistant avec simulation continue hors-ligne
- ✅ Structure hiérarchique galaxie → secteurs (clusters) → systèmes → planètes
- ✅ Système de notifications pour événements critiques (SMS → Push moderne)
- ✅ Chargement contextuel : un environnement actif par joueur
- ✅ Cartes planétaires wraparound (sans bordures)
- ✅ Scalabilité massive vers des dizaines de milliers de systèmes

**Améliorations apportées :**
- 🚀 Architecture P2P décentralisée avec PeerJS vs serveur centralisé
- 🚀 Visualisation 3D avec Three.js (primitives géométriques) vs 2D
- 🚀 TypeScript obligatoire pour cohérence et sécurité de type
- 🚀 Vaisseaux modulaires construits procéduralement
- 🚀 Système de gouvernance par votes distribués (les "Lois Constitution")
- 🚀 Brouillard de guerre historique avec marqueurs temporels
- 🚀 10 mécaniques de gameplay avancées (événements, espionnage, artefacts, etc.)
- 🚀 Bourse galactique en temps réel avec fluctuations dynamiques
- 🚀 Consensus distribué pour anti-triche sans serveur central

**Référence :** Mankind (1998-2015) - 73,251 systèmes stellaires, 476,265 planètes, univers persistant complet.

---

## Architecture Technique Détaillée

### Découverte et Connexion avec PeerJS

```typescript
import Peer from 'peerjs';

// Créer un peer avec ID dérivé de la clé publique
const peer = new Peer(deriveIdFromPublicKey(publicKey), {
  host: 'peerjs.com',  // Serveur cloud gratuit
  port: 443,
  secure: true,
  debug: 2  // Logs détaillés en dev
});

// Événement : connexion établie
peer.on('open', (id) => {
  console.log('Peer ID:', id);
  // Annoncer présence dans le cluster
  broadcastPresence({ clusterId: 'cluster-42', reputation: 50 });
});

// Connexion à un autre pair
const conn = peer.connect('autre-peer-id');
conn.on('open', () => {
  conn.send({ type: 'hello', from: peer.id });
});

// Réception de connexion entrante
peer.on('connection', (conn) => {
  conn.on('data', (data) => {
    handlePeerMessage(data);
  });
});
```

**Avantages PeerJS** :
- Serveur signaling gratuit (peerjs.com)
- Option self-hosted disponible (peerjs-server)
- API simple et bien documentée
- Fallback automatique TURN/STUN
- Compatible avec WebRTC standard

### Mécanisme d'Autorité Distribuée

**Élection des Validateurs**
1. Chaque cluster maintient liste des pairs connectés avec scores de réputation
2. Top 5-15 pairs (selon population) deviennent validateurs
3. Rotation automatique toutes les 30 minutes
4. Nouveaux joueurs (score < 50) ne peuvent être validateurs

**Flux de Validation d'Action**
```typescript
// 1. Joueur signe action avec clé privée
const action = signAction({ type: 'build', building: 'factory', coords });

// 2. Broadcast aux validateurs du cluster via PeerJS
validators.forEach(v => v.send({ type: 'validate', action }));

// 3. Validateurs vérifient et votent
const votes = await collectVotes(action, timeout: 2000); // 2s

// 4. Si majorité (51%+) accepte → action exécutée
if (votes.approve / votes.total > 0.51) {
  executeAction(action);
  broadcastToCluster({ type: 'action-confirmed', action });
}
```

**Détection de Triche**
- Validateur vérifie cohérence : ressources suffisantes, position valide, cooldown respecté
- Incohérence détectée → Vote de bannissement proposé
- 75%+ validateurs approuvent → Score réputation -20, broadcast ban si < 20

### Flux de Connexion P2P
1. Client crée un Peer avec ID dérivé de sa clé publique cryptographique
2. PeerJS gère automatiquement le signaling et découverte via serveur
3. Client broadcast son existence dans le cluster (via connexions directes)
4. Réception liste des pairs du même cluster avec scores de réputation
5. Établissement connexions WebRTC avec validateurs + pairs proches
6. Échange d'état initial (snapshot) avec validateur principal
7. Synchronisation continue via messages PeerJS + validation distribuée

### Structure des Primitives 3D
```typescript
import * as THREE from 'three';

// Exemple de vaisseau construit avec primitives
class ModularShip extends THREE.Group {
  hull: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  engines: THREE.Mesh<THREE.CylinderGeometry>[];
  weapons: THREE.Mesh<THREE.ConeGeometry>[];
  
  constructor(config: ShipConfig) {
    super();
    
    // Coque
    this.hull = new THREE.Mesh(
      new THREE.BoxGeometry(5, 2, 10),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    this.add(this.hull);
    
    // Moteurs (procédural selon config)
    config.engines.forEach((pos) => {
      const engine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.8, 2),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
      );
      engine.position.copy(pos);
      this.engines.push(engine);
      this.add(engine);
    });
  }
}
```

### Protocole de Consensus
- **Actions Locales** (Mouvement, UI) : Instantanées, validation asynchrone a posteriori
- **Actions Moyennes** (Commerce < 1000 ressources, construction basique) : Validation par 3 validateurs aléatoires
- **Actions Critiques** (Combat, transfert massif, votes de lois) : Validation par majorité (51%+) de tous les validateurs

### Gestion des Validateurs Malveillants
- Si validateur approuve action incohérente détectée par autres : Score -10
- Si 3+ détections en 1 heure : Révocation immédiate + score -30
- Système de "challenge" : Tout pair peut contester validation, autres validateurs arbitrent

---
## Implémentation des Mécaniques de Gameplay

### Événements Galactiques (Exemple)
```typescript
interface GalacticEvent {
  id: string;
  type: 'storm' | 'meteor-rain' | 'quantum-anomaly' | 'alien-invasion' | 'comet';
  affectedCluster: string;
  duration: number; // secondes
  effects: {
    travelSpeedModifier?: number; // -0.5 = -50% vitesse
    resourceBonus?: { type: ResourceType; amount: number }[];
    portalTo?: string; // cluster ID
  };
  startTime: number; // timestamp
}

// Vote consensus pour déclencher événement
async function proposeEvent(event: GalacticEvent): Promise<boolean> {
  const proposal = signProposal(event, privateKey);
  const votes = await broadcastToValidators({ type: 'event-vote', proposal });
  return votes.approve / votes.total > 0.66; // 66% requis
}
```

### Artefacts et Archéologie
```typescript
interface Artifact {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  bonus: {
    type: 'speed' | 'production' | 'combat' | 'research';
    value: number; // pourcentage
  };
  setId?: string; // pour collections
  discoveredBy: string; // player ID
  discoveredAt: number; // timestamp
}

// Expédition archéologique
class ArcheologicalExpedition {
  planetId: string;
  startTime: number;
  duration: number; // heures
  successProbability: number; // 0-1
  
  async complete(): Promise<Artifact | null> {
    const elapsed = Date.now() - this.startTime;
    if (elapsed < this.duration * 3600000) return null;
    
    const success = Math.random() < this.successProbability;
    if (!success) return null;
    
    return generateArtifact(this.planetId);
  }
}
```

### Système de Héros
```typescript
interface Hero {
  id: string;
  name: string;
  type: 'general' | 'scientist' | 'diplomat';
  level: number; // 1-10
  experience: number;
  bonuses: {
    general: { combatBonus: number }; // +15% par level
    scientist: { researchBonus: number }; // +25% par level
    diplomat: { influenceBonus: number }; // +vote power
  }[keyof this['type']];
  alive: boolean;
  assignedTo?: string; // fleet ID ou base ID
}

// Mort en mission (probabilité basée sur danger)
function checkHeroSurvival(hero: Hero, missionDanger: number): boolean {
  const survivalChance = Math.max(0.5, 1 - (missionDanger / hero.level));
  return Math.random() < survivalChance;
}
```

### Contrats et Missions
```typescript
interface Contract {
  id: string;
  type: 'transport' | 'escort' | 'assassination' | 'recon' | 'terraform';
  issuer: string; // player ID ou 'system'
  reward: {
    credits: number;
    resources?: { type: ResourceType; amount: number }[];
    reputation: number;
    blueprint?: string;
  };
  requirements: {
    deliverTo?: string; // système ID
    protect?: string; // cargo ID
    target?: string; // vaisseau ID
    scanSystem?: string;
    planet?: string;
  };
  deadline: number; // timestamp
  accepted: boolean;
  acceptedBy?: string; // player ID
  completed: boolean;
}

// Tableau de contrats P2P
class ContractBoard {
  contracts: Map<string, Contract> = new Map();
  
  // Joueurs postent contrats, validés par consensus
  async postContract(contract: Contract): Promise<boolean> {
    const signed = signContract(contract, privateKey);
    const votes = await broadcastToValidators({ type: 'contract-post', signed });
    if (votes.approve / votes.total > 0.51) {
      this.contracts.set(contract.id, contract);
      return true;
    }
    return false;
  }
}
```

### Factions Internes
```typescript
interface Faction {
  type: 'military' | 'scientific' | 'commercial';
  satisfaction: number; // 0-100
  influence: number; // 0-100
}

interface FactionSystem {
  factions: Map<Faction['type'], Faction>;
  
  // Mise à jour satisfaction basée sur actions joueur
  updateSatisfaction(action: PlayerAction): void {
    switch (action.type) {
      case 'research':
        this.modifySatisfaction('scientific', +5);
        break;
      case 'trade':
        this.modifySatisfaction('commercial', +3);
        break;
      case 'attack':
        this.modifySatisfaction('military', +4);
        this.modifySatisfaction('commercial', -2);
        break;
    }
    
    // Vérifier coup d'état
    this.checkCoup();
  }
  
  checkCoup(): void {
    for (const [type, faction] of this.factions) {
      if (faction.satisfaction < 10) {
        // Coup d'état après 7 jours
        this.triggerCoup(type);
      }
    }
  }
}
```

---

Pour des conseils d'exécution pendant le développement, se référer au guide [SPECKIT_GUIDE.md] et aux templates Speckit dans `.specify/templates/`.

**Version** : 3.0.0 | **Ratifiée** : 2025-12-15 | **Dernière Modification** : 2025-12-26
