# Guide d'utilisation Speckit

## 📋 Ordre d'utilisation des outils

### 1. **speckit.constitution** (Optionnel mais recommandé)
**Quand:** Au début du projet
**But:** Définir les principes et règles du projet

```
Créer ou mettre à jour la constitution du projet
```

---

### 2. **speckit.specify**
**Quand:** Pour chaque nouvelle fonctionnalité
**But:** Créer une spécification détaillée de la fonctionnalité

```
Décrire la fonctionnalité en langage naturel
→ Génère un fichier spec.md
```

---

### 3. **speckit.clarify**
**Quand:** Après avoir créé la spécification
**But:** Identifier et clarifier les points ambigus

```
Répond à max 5 questions ciblées
→ Met à jour spec.md avec les réponses
```

---

### 4. **speckit.plan**
**Quand:** Une fois la spécification clarifiée
**But:** Créer le plan de conception et d'implémentation

```
Génère les artefacts de conception
→ Crée plan.md
```

---

### 5. **speckit.analyze** (Optionnel)
**Quand:** Après la planification
**But:** Vérifier la cohérence entre spec.md, plan.md et tasks.md

```
Analyse non-destructive
→ Rapport de qualité et cohérence
```

---

### 6. **speckit.tasks**
**Quand:** Après la planification
**But:** Générer la liste des tâches ordonnées

```
Crée des tâches avec dépendances
→ Génère tasks.md
```

---

### 7. **speckit.checklist** (Optionnel)
**Quand:** Avant l'implémentation
**But:** Créer une checklist personnalisée pour la fonctionnalité

```
Génère une checklist basée sur les exigences
```

---

### 8. **speckit.implement**
**Quand:** Prêt à coder
**But:** Exécuter le plan d'implémentation

```
Traite et exécute toutes les tâches de tasks.md
```

---

### 9. **speckit.taskstoissues** (Optionnel)
**Quand:** Pour gérer le projet sur GitHub
**But:** Convertir les tâches en issues GitHub

```
Crée des issues GitHub avec dépendances
```

---

## 🚀 Workflow rapide (minimum)

Pour une utilisation rapide, voici le workflow minimum :

```
1. speckit.specify    → Créer la spec
2. speckit.clarify    → Clarifier si nécessaire
3. speckit.plan       → Créer le plan
4. speckit.tasks      → Générer les tâches
5. speckit.implement  → Implémenter
```

---

## 💡 Conseils

- **Première fois:** Commencez par `speckit.constitution` pour établir les règles du projet
- **Itération:** Vous pouvez revenir à n'importe quelle étape pour affiner
- **Analyse:** Utilisez `speckit.analyze` régulièrement pour vérifier la cohérence
- **Checklist:** Utilisez `speckit.checklist` pour des fonctionnalités complexes
- **GitHub:** Utilisez `speckit.taskstoissues` si vous travaillez en équipe

---

## 📝 Exemple d'utilisation

```
1. "speckit.specify: Créer un système d'authentification utilisateur"
   → Génère spec.md

2. "speckit.clarify"
   → Répond aux questions sur la sécurité, le stockage, etc.

3. "speckit.plan"
   → Crée plan.md avec l'architecture

4. "speckit.tasks"
   → Génère tasks.md avec toutes les étapes

5. "speckit.implement"
   → Code automatiquement toutes les tâches
```

---

## ❓ Quand utiliser chaque outil

| Outil | Obligatoire | Fréquence |
|-------|-------------|-----------|
| constitution | Non | 1x par projet |
| specify | **Oui** | 1x par fonctionnalité |
| clarify | Recommandé | Après chaque specify |
| plan | **Oui** | 1x par fonctionnalité |
| analyze | Non | Quand nécessaire |
| tasks | **Oui** | 1x par fonctionnalité |
| checklist | Non | Pour features complexes |
| implement | **Oui** | 1x par fonctionnalité |
| taskstoissues | Non | Si utilisation de GitHub |

---

**Note:** Les outils marqués en **gras** sont essentiels au workflow de base.
