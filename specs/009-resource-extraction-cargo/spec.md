# Spécification de la fonctionnalité : Extraction de Ressources et Cargo

**Branche de fonctionnalité** : `009-resource-extraction-cargo`  
**Créé le** : 2025-12-25  
**Statut** : Brouillon  
**Entrée** : Description utilisateur : "Create a specification for Feature 009: Resource Extraction & Cargo. The feature should include: - Planets having a set of resources (from the 10 types defined in the Constitution). - A CargoComponent for ships with a limited capacity. - An 'Extraction' system: Player must be within a certain distance of a planet. Pressing 'G' (Gather) starts extraction. Extraction takes time and fills the cargo. - A 'Cargo UI' (part of the HUD) showing current inventory. - P2P Sync: Other players should see if someone is extracting (maybe a visual effect)."

## Scénarios Utilisateur & Tests *(obligatoire)*

### Scénario Utilisateur 1 - Explorer les ressources d'une planète (Priorité : P1)

En tant que pilote, je veux voir quelles ressources sont disponibles sur une planète lorsque je m'en approche.

**Pourquoi cette priorité** : C'est la première étape de la boucle de gameplay économique.

**Test Indépendant** : S'approcher d'une planète et vérifier que l'interface affiche la liste des ressources présentes.

**Scénarios d'Acceptation** :

1. **Étant donné** une planète générée procéduralement, **Quand** je suis à portée de détection, **Alors** je peux voir les types de ressources (ex: Fer, Eau) qu'elle contient.

---

### Scénario Utilisateur 2 - Extraire des ressources (Priorité : P1)

En tant que mineur, je veux pouvoir extraire des ressources d'une planète pour remplir mon cargo.

**Pourquoi cette priorité** : Mécanique de base pour l'acquisition de ressources.

**Test Indépendant** : Se placer près d'une planète, appuyer sur 'G', et vérifier que le cargo se remplit progressivement.

**Scénarios d'Acceptation** :

1. **Étant donné** que je suis à moins de 500 unités d'une planète, **Quand** j'appuie sur 'G', **Alors** le processus d'extraction commence.
2. **Étant donné** que l'extraction est en cours, **Quand** le temps passe, **Alors** la quantité de ressources dans mon `CargoComponent` augmente et la capacité restante diminue.
3. **Étant donné** que l'extraction est en cours, **Quand** je m'éloigne de la planète au-delà de la distance limite, **Alors** l'extraction s'arrête automatiquement.

---

### Scénario Utilisateur 3 - Gérer le cargo (Priorité : P1)

En tant que transporteur, je veux voir l'état de mon inventaire pour savoir quand je dois aller décharger ou vendre.

**Pourquoi cette priorité** : Nécessaire pour la gestion de l'espace de stockage limité.

**Test Indépendant** : Ouvrir le HUD et vérifier que les quantités de chaque ressource et la capacité totale sont affichées.

**Scénarios d'Acceptation** :

1. **Étant donné** que j'ai des ressources en soute, **Quand** je regarde le HUD, **Alors** je vois le détail par type de ressource (ex: Fer: 50, Cuivre: 20).
2. **Étant donné** que mon cargo est plein, **Quand** je tente d'extraire plus de ressources, **Alors** l'extraction ne démarre pas ou s'arrête, et un message "Cargo Plein" s'affiche.

---

### Scénario Utilisateur 4 - Synchronisation visuelle de l'extraction (Priorité : P2)

En tant que joueur, je veux voir quand un autre joueur est en train d'extraire des ressources.

**Pourquoi cette priorité** : Immersion et interaction sociale/compétitive (savoir qui mine quoi).

**Test Indépendant** : Observer un autre joueur en train de miner et vérifier qu'un effet visuel (ex: rayon laser de minage) est visible.

**Scénarios d'Acceptation** :

1. **Étant donné** que le Joueur A commence l'extraction, **Quand** le Joueur B regarde le vaisseau du Joueur A, **Alors** le Joueur B voit un effet visuel reliant le vaisseau à la planète.

---

### Cas Limites

- Que se passe-t-il si la planète est épuisée ? (L'extraction doit s'arrêter).
- Que se passe-t-il si le vaisseau est détruit pendant l'extraction ? (Les ressources en soute pourraient être perdues ou éjectées).
- Plusieurs joueurs peuvent-ils extraire de la même planète simultanément ? (Oui, mais cela peut accélérer l'épuisement).

## Exigences *(obligatoire)*

### Exigences Fonctionnelles

- **FR-001** : Chaque planète DOIT posséder un `ResourceComponent` contenant une liste de ressources parmi les 10 types constitutionnels (Fer, Cuivre, Eau, Hélium-3, Silicium, Uranium, Titane, Terres Rares, Hydrogène, Carbone).
- **FR-002** : Les vaisseaux DOIVENT posséder un `CargoComponent` avec une `maxCapacity` et un dictionnaire `inventory`.
- **FR-003** : Le système DOIT détecter l'appui sur la touche 'G' pour basculer l'état d'extraction.
- **FR-004** : L'extraction ne DOIT être possible que si la distance entre le vaisseau et la planète est inférieure à `MINING_RANGE`.
- **FR-005** : L'extraction DOIT ajouter des ressources au cargo à un taux de `EXTRACTION_RATE` par seconde.
- **FR-006** : Le HUD DOIT afficher en temps réel le contenu du cargo.
- **FR-007** : Un événement réseau DOIT être envoyé pour synchroniser l'état "en cours d'extraction" entre les pairs.
- **FR-008** : Un effet visuel (ex: `Line` ou `Cylinder` entre le vaisseau et la planète) DOIT être affiché pendant l'extraction.

### Entités Clés

- **Planète** : Entité avec `PositionComponent`, `ResourceComponent`.
- **Vaisseau** : Entité avec `PositionComponent`, `CargoComponent`, `MiningStateComponent`.

## Critères de Succès *(obligatoire)*

- **Mesurable** : L'interface du cargo se met à jour à 60 FPS sans latence perceptible.
- **Mesurable** : La synchronisation de l'effet visuel se fait en moins de 200ms entre les pairs.
- **Agnostique à la technologie** : Le système de cargo peut supporter n'importe quel nombre de types de ressources sans modification structurelle.
- **Axé sur l'utilisateur** : Le joueur comprend immédiatement s'il est en train de miner et quand son cargo est plein.

## Hypothèses et Dépendances

- **Hypothèse** : Les ressources sur les planètes sont infinies pour cette première version (ou très grandes).
- **Hypothèse** : L'extraction est uniforme pour tous les types de ressources présents sur la planète.
- **Dépendance** : Nécessite le système de positionnement et de distance fonctionnel.
- **Dépendance** : Nécessite le HUD de base pour l'affichage.

## Questions résolues

- **Touche d'activation** : 'G' (Gather).
- **Types de ressources** : Les 10 types définis dans la Constitution.
