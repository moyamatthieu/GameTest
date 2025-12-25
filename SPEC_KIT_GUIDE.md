# Guide d'Utilisation de Spec Kit - Galactic Dominion

## 🎯 Qu'est-ce que Spec Kit ?

Spec Kit est un toolkit pour le **Spec-Driven Development** (SDD), une méthodologie qui privilégie la création de spécifications exécutables avant le code. Les spécifications deviennent le point central du développement, générant directement les implémentations.

## 📁 Structure Installée

```
.github/
  prompts/               # Commandes slash pour GitHub Copilot
    speckit.constitution.prompt.md
    speckit.specify.prompt.md
    speckit.plan.prompt.md
    speckit.tasks.prompt.md
    speckit.implement.prompt.md
    (et autres)

.specify/
  memory/
    constitution.md      # Principes du projet (déjà configuré !)
  scripts/
    powershell/          # Scripts PowerShell d'automatisation
  templates/             # Templates pour specs, plans, tasks
```

## 🚀 Workflow de Développement

### 1. Constitution (✅ FAIT)
Vos principes de projet sont déjà établis dans `.specify/memory/constitution.md` :
- Architecture serveur-autoritaire
- ECS pur (Entities/Components/Systems)
- TypeScript first
- Multi-échelles (Macro/Meso/Micro)

### 2. Créer une Spécification
Utilisez la commande slash `/speckit.specify` dans GitHub Copilot :

```
/speckit.specify Ajouter un système de commerce interplanétaire où les joueurs peuvent 
échanger des ressources entre planètes. Le système doit gérer les flottes de transport, 
les prix dynamiques basés sur l'offre et la demande, et les temps de trajet.
```

**Que se passe-t-il ?**
- Création automatique d'une branche git (ex: `003-interplanetary-trade`)
- Génération de `specs/003-interplanetary-trade/spec.md`
- Structure complète avec user stories et critères d'acceptation

### 3. Clarifier la Spec (Optionnel)
Si des points sont ambigus :

```
/speckit.clarify Comment gérer les collisions de flottes ? Que se passe-t-il si une 
planète manque de ressources pendant un trajet ?
```

### 4. Créer un Plan Technique
Fournissez votre stack technique :

```
/speckit.plan Utiliser le composant Fleet existant et créer un nouveau composant Trade. 
Ajouter TradeSystem dans common/ecs/systems/. Côté client, créer TradeUI dans src/ui/. 
Utiliser MessagePack pour les messages de trade.
```

**Génère :**
- `specs/003-interplanetary-trade/plan.md` (plan détaillé)
- `specs/003-interplanetary-trade/research.md` (recherche technique)
- `specs/003-interplanetary-trade/data-model.md` (modèles de données)
- `specs/003-interplanetary-trade/contracts/` (API contracts)

### 5. Générer les Tâches
Décomposer le plan en tâches actionnables :

```
/speckit.tasks
```

**Génère :**
- `specs/003-interplanetary-trade/tasks.md`
- Liste de tâches avec dépendances
- Ordre d'exécution recommandé

### 6. Valider le Plan (Optionnel)
Vérifier la cohérence :

```
/speckit.analyze
```

### 7. Implémenter
Exécuter automatiquement toutes les tâches :

```
/speckit.implement
```

**L'agent Copilot :**
- Lit le plan et les tâches
- Crée les fichiers nécessaires
- Suit l'ordre des dépendances
- Exécute les tests (TDD)
- Fournit des mises à jour de progression

## 📝 Commandes Disponibles

### Commandes Principales
| Commande | Description |
|----------|-------------|
| `/speckit.constitution` | Créer/modifier les principes du projet |
| `/speckit.specify` | Créer une spécification fonctionnelle |
| `/speckit.plan` | Générer un plan d'implémentation technique |
| `/speckit.tasks` | Décomposer en tâches actionnables |
| `/speckit.implement` | Exécuter l'implémentation |

### Commandes Optionnelles (Qualité)
| Commande | Description |
|----------|-------------|
| `/speckit.clarify` | Poser des questions structurées sur la spec |
| `/speckit.analyze` | Rapport de cohérence entre artéfacts |
| `/speckit.checklist` | Valider la complétude des requirements |

## 🎯 Exemple Concret : Ajouter un Nouveau Système

### Scénario : Système de Diplomatie

**Étape 1 - Spécifier :**
```
/speckit.specify Ajouter un système de diplomatie permettant aux joueurs d'établir des 
relations avec des factions NPC. Gérer la réputation (-100 à +100), les traités 
(paix, commerce, alliance), et les événements diplomatiques aléatoires.
```

**Étape 2 - Clarifier (si besoin) :**
```
/speckit.clarify Comment la réputation affecte-t-elle les prix de commerce ? 
Quels sont les critères pour proposer un traité ?
```

**Étape 3 - Planifier :**
```
/speckit.plan Créer un composant Diplomacy dans common/ecs/components.ts avec les champs :
- faction (string)
- relations (Map<factionId, reputation>)
- treaties (Array<Treaty>)

Créer DiplomacySystem dans common/ecs/systems/DiplomacySystem.ts.
Enregistrer le système dans server/ecs/ServerWorld.ts.
Côté client, créer DiplomacyPanel dans src/ui/DiplomacyPanel.ts.
```

**Étape 4 - Décomposer :**
```
/speckit.tasks
```

**Étape 5 - Implémenter :**
```
/speckit.implement
```

## 🔍 Structure des Specs

Chaque feature génère un dossier structuré :

```
specs/
  003-diplomacy-system/
    spec.md           # Spécification fonctionnelle
    plan.md           # Plan d'implémentation
    research.md       # Recherches techniques
    data-model.md     # Modèles de données
    contracts/        # Contrats API
    quickstart.md     # Scénarios de validation
    tasks.md          # Liste de tâches
```

## ⚙️ Intégration avec Votre Projet

### Respect de la Constitution

Spec Kit respecte automatiquement vos principes :

✅ **Architecture Serveur-Autoritaire**
- Les plans générés placent la logique dans `common/ecs/systems/`
- Le client ne fait que du rendu/input

✅ **ECS Pur**
- Composants sans logique
- Systèmes avec toute la logique

✅ **TypeScript First**
- Nouveau code en `.ts`
- Types stricts

### Commandes Git Automatiques

Les scripts PowerShell gèrent automatiquement :
- Création de branches (`003-feature-name`)
- Commits structurés
- Numérotation séquentielle des features

## 🛠️ Scripts PowerShell

Tous les scripts sont dans `.specify/scripts/powershell/` :

| Script | Fonction |
|--------|----------|
| `create-new-feature.ps1` | Crée la structure de spec + branche |
| `setup-plan.ps1` | Génère le plan technique |
| `check-prerequisites.ps1` | Vérifie les outils requis |
| `update-agent-context.ps1` | Met à jour la mémoire de l'agent |

## 📚 Bonnes Pratiques

### ✅ À Faire
- Être explicite dans les spécifications (QUOI et POURQUOI)
- Clarifier les ambiguïtés AVANT de planifier
- Valider le plan avec `/speckit.analyze`
- Laisser l'agent gérer l'implémentation
- Documenter les décisions dans la spec

### ❌ À Éviter
- Se concentrer sur la stack technique dans `/speckit.specify`
- Sauter l'étape de planification
- Modifier manuellement les fichiers générés sans régénérer
- Implémenter avant d'avoir validé le plan

## 🔄 Workflow Itératif

Spec Kit supporte l'itération :

1. **Feature initiale** : `/speckit.specify` → `/speckit.plan` → `/speckit.implement`
2. **Amélioration** : Modifier `spec.md` → Régénérer avec `/speckit.plan`
3. **Nouvelle tâche** : Mettre à jour `tasks.md` → `/speckit.implement`

## 🎓 Ressources

- **Documentation officielle** : https://github.github.io/spec-kit/
- **Guide SDD** : `.specify/templates/` (voir spec-driven.md)
- **Exemples** : https://github.com/github/spec-kit/tree/main/templates

## 🚦 Commencer Maintenant

**Créez votre première spécification :**

```
/speckit.specify [Décrivez votre feature ici]
```

Spec Kit va :
1. Créer une branche automatiquement
2. Générer la structure de spec
3. Vous guider vers l'étape suivante

**Bonne construction ! 🚀**
